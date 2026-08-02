"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "gabytron-photo-replacements-v1";
const LAYOUT_STORAGE_KEY = "gabytron-photo-layouts-v1";
const UPLOAD_DB = "gabytron-photo-editor";
const UPLOAD_STORE = "uploads";

type ReplacementMap = Record<string, string>;
type EditorKind = "photo" | "background" | "text" | "section" | "header";
type PhotoLayout = { x: number; y: number; scale: number; paddingTop?: number; paddingBottom?: number; height?: number };
type LayoutMap = Record<string, PhotoLayout>;
type StoredUpload = { id: string; name: string; type: string; blob: Blob };
type UploadAsset = StoredUpload & { key: string; src: string };
type EditorAsset = { key: string; src: string; group: string; label: string };

function readReplacements(): ReplacementMap {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

const DEFAULT_LAYOUT: PhotoLayout = { x: 0, y: 0, scale: 1 };

function readLayouts(): LayoutMap {
  try {
    return JSON.parse(window.localStorage.getItem(LAYOUT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function clampLayout(layout: PhotoLayout): PhotoLayout {
  return {
    x: Math.max(-1000, Math.min(1000, Math.round(layout.x))),
    y: Math.max(-1000, Math.min(1000, Math.round(layout.y))),
    scale: Math.max(0.35, Math.min(2.5, Math.round(layout.scale * 100) / 100)),
    ...(layout.paddingTop === undefined ? {} : { paddingTop: Math.max(0, Math.min(400, Math.round(layout.paddingTop))) }),
    ...(layout.paddingBottom === undefined ? {} : { paddingBottom: Math.max(0, Math.min(400, Math.round(layout.paddingBottom))) }),
    ...(layout.height === undefined ? {} : { height: Math.max(360, Math.min(1400, Math.round(layout.height))) }),
  };
}

function applyLayout(element: HTMLElement, layout: PhotoLayout) {
  element.dataset.photoEditorLayout = "true";
  element.style.setProperty("--photo-editor-x", `${layout.x}px`);
  element.style.setProperty("--photo-editor-y", `${layout.y}px`);
  element.style.setProperty("--photo-editor-scale", `${layout.scale}`);
  if (element.dataset.photoEditorKind === "section") {
    if (layout.paddingTop === undefined) element.style.removeProperty("padding-top");
    else element.style.paddingTop = `${layout.paddingTop}px`;
    if (layout.paddingBottom === undefined) element.style.removeProperty("padding-bottom");
    else element.style.paddingBottom = `${layout.paddingBottom}px`;
  }
  if (element.dataset.photoEditorKind === "header") {
    if (layout.height === undefined) {
      element.style.removeProperty("height");
      element.style.removeProperty("min-height");
    } else {
      element.style.height = `${layout.height}px`;
      element.style.minHeight = `${layout.height}px`;
    }
  }
}

function layoutForElement(element: HTMLElement): PhotoLayout {
  return clampLayout({
    x: Number.parseFloat(element.style.getPropertyValue("--photo-editor-x")) || 0,
    y: Number.parseFloat(element.style.getPropertyValue("--photo-editor-y")) || 0,
    scale: Number.parseFloat(element.style.getPropertyValue("--photo-editor-scale")) || 1,
    ...(element.dataset.photoEditorKind === "section" ? {
      paddingTop: Number.parseFloat(element.style.paddingTop) || Number.parseFloat(window.getComputedStyle(element).paddingTop) || 0,
      paddingBottom: Number.parseFloat(element.style.paddingBottom) || Number.parseFloat(window.getComputedStyle(element).paddingBottom) || 0,
    } : {}),
    ...(element.dataset.photoEditorKind === "header" ? {
      height: Number.parseFloat(element.style.height) || element.getBoundingClientRect().height,
    } : {}),
  });
}

function layoutFor(key: string) {
  return clampLayout(readLayouts()[key] || DEFAULT_LAYOUT);
}

function openUploadDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(UPLOAD_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(UPLOAD_STORE)) request.result.createObjectStore(UPLOAD_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadUploads() {
  const database = await openUploadDatabase();
  return new Promise<StoredUpload[]>((resolve, reject) => {
    const request = database.transaction(UPLOAD_STORE, "readonly").objectStore(UPLOAD_STORE).getAll();
    request.onsuccess = () => {
      database.close();
      resolve(request.result as StoredUpload[]);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function saveUpload(file: File) {
  const record: StoredUpload = { id: window.crypto.randomUUID(), name: file.name, type: file.type, blob: file };
  const database = await openUploadDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, "readwrite");
    transaction.objectStore(UPLOAD_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return record;
}

function isEditablePhoto(image: HTMLImageElement) {
  const src = image.getAttribute("src") || "";
  return !image.closest("[data-photo-editor-ui]") && !src.includes("/media/logo.png") && !src.includes("/og.png");
}

function resolveSource(source: string, localUrls: Map<string, string>) {
  return source.startsWith("local-upload:") ? localUrls.get(source) || "" : source;
}

function preparePhoto(image: HTMLImageElement, replacements: ReplacementMap, localUrls: Map<string, string>) {
  if (!isEditablePhoto(image)) return;

  if (!image.dataset.photoEditorKey) {
    const editableImages = Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter(isEditablePhoto);
    const index = editableImages.indexOf(image);
    const original = image.getAttribute("src") || "";
    image.dataset.photoEditorOriginal = original;
    image.dataset.photoEditorKey = `${window.location.pathname}::${index}::${original}`;
  }

  const replacement = replacements[image.dataset.photoEditorKey];
  image.dataset.photoEditorKind = "photo";
  const resolved = replacement ? resolveSource(replacement, localUrls) : "";
  if (resolved && image.getAttribute("src") !== resolved) image.setAttribute("src", resolved);
  applyLayout(image, layoutFor(image.dataset.photoEditorKey));
}

function prepareBackground(element: HTMLElement, replacements: ReplacementMap, localUrls: Map<string, string>) {
  const original = element.dataset.photoEditorSource || "";
  if (!original) return;

  if (!element.dataset.photoEditorKey) {
    const editableBackgrounds = Array.from(document.querySelectorAll<HTMLElement>("[data-photo-editor-background]"));
    const index = editableBackgrounds.indexOf(element);
    element.dataset.photoEditorOriginal = original;
    element.dataset.photoEditorKey = `${window.location.pathname}::background-${index}::${original}`;
  }

  const replacement = replacements[element.dataset.photoEditorKey];
  element.dataset.photoEditorKind = "background";
  const resolved = replacement ? resolveSource(replacement, localUrls) : "";
  if (resolved) element.style.setProperty("--gallery-cover", `url('${resolved}')`);
  applyLayout(element, layoutFor(element.dataset.photoEditorKey));
}

function assetGroup(src: string) {
  if (src.startsWith("local-upload:")) return "my uploads";
  if (src.startsWith("/galleries/")) return src.split("/")[2];
  if (src.startsWith("/featured/")) return "featured";
  return "homepage";
}

function assetLabel(src: string) {
  return src.split("/").pop()?.replace(/\.[^.]+$/, "").replaceAll("-", " ") || "Site photo";
}

function isEditableText(element: Element) {
  const text = element.closest<HTMLElement>("h1,h2,h3,p");
  if (!text || text.closest("[data-photo-editor-ui],nav,footer")) return null;
  return text;
}

function prepareLayoutTarget(element: HTMLElement, kind: "text" | "section" | "header") {
  if (!element.dataset.photoEditorKey) {
    const selector = kind === "text" ? "h1,h2,h3,p" : kind === "header" ? ".hero,.galleryHero" : "main section:not(.hero):not(.galleryHero)";
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((target) => !target.closest("[data-photo-editor-ui],nav,footer"));
    element.dataset.photoEditorKey = `${window.location.pathname}::${kind}-${targets.indexOf(element)}::${element.tagName.toLowerCase()}`;
  }
  element.dataset.photoEditorKind = kind;
  const saved = readLayouts()[element.dataset.photoEditorKey];
  if (saved) applyLayout(element, clampLayout(saved));
}

export function PhotoEditor({ assets }: { assets: string[] }) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedKind, setSelectedKind] = useState<EditorKind>("photo");
  const [selectedLayout, setSelectedLayout] = useState<PhotoLayout>(DEFAULT_LAYOUT);
  const [notice, setNotice] = useState("");
  const [uploads, setUploads] = useState<UploadAsset[]>([]);
  const targetRef = useRef<HTMLImageElement | null>(null);
  const backgroundTargetRef = useRef<HTMLElement | null>(null);
  const layoutTargetRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ key: string; target: HTMLElement; startX: number; startY: number; initial: PhotoLayout } | null>(null);
  const localUrlsRef = useRef(new Map<string, string>());

  const editorAssets = useMemo<EditorAsset[]>(() => [
    ...assets.map((src) => ({ key: src, src, group: assetGroup(src), label: assetLabel(src) })),
    ...uploads.map((upload) => ({ key: upload.key, src: upload.src, group: "my uploads", label: upload.name })),
  ], [assets, uploads]);
  const groups = useMemo(() => ["all", ...Array.from(new Set(editorAssets.map((asset) => asset.group))).sort()], [editorAssets]);
  const filteredAssets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return editorAssets.filter((asset) => {
      const matchesGroup = group === "all" || asset.group === group;
      return matchesGroup && (!search || `${asset.label} ${asset.group}`.toLowerCase().includes(search));
    });
  }, [editorAssets, group, query]);

  useEffect(() => {
    const local = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setAvailable(local);
    if (!local) return;

    let stopped = false;
    const applySavedPhotos = () => {
      const replacements = readReplacements();
      document.querySelectorAll<HTMLImageElement>("img").forEach((image) => preparePhoto(image, replacements, localUrlsRef.current));
      document.querySelectorAll<HTMLElement>("[data-photo-editor-background]").forEach((element) => prepareBackground(element, replacements, localUrlsRef.current));
      document.querySelectorAll<HTMLElement>("h1,h2,h3,p").forEach((element) => {
        if (!element.closest("[data-photo-editor-ui],nav,footer")) prepareLayoutTarget(element, "text");
      });
      document.querySelectorAll<HTMLElement>("main section:not(.hero):not(.galleryHero)").forEach((element) => prepareLayoutTarget(element, "section"));
      document.querySelectorAll<HTMLElement>(".hero,.galleryHero").forEach((element) => prepareLayoutTarget(element, "header"));
    };

    applySavedPhotos();
    const observer = new MutationObserver(applySavedPhotos);
    observer.observe(document.body, { childList: true, subtree: true });

    void loadUploads().then((records) => {
      if (stopped) return;
      const loaded = records.map((record) => {
        const key = `local-upload:${record.id}`;
        const src = URL.createObjectURL(record.blob);
        localUrlsRef.current.set(key, src);
        return { ...record, key, src };
      });
      setUploads(loaded);
      applySavedPhotos();
    }).catch(() => setNotice("Saved computer photos could not be loaded."));

    return () => {
      stopped = true;
      observer.disconnect();
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const selectTarget = (
      image: HTMLImageElement | null,
      background: HTMLElement | null,
      layoutElement: HTMLElement | null = null,
      layoutKind: "text" | "section" | "header" | null = null,
    ) => {
      const replacements = readReplacements();
      document.querySelectorAll<HTMLElement>("[data-photo-editor-selected]").forEach((element) => delete element.dataset.photoEditorSelected);
      if (image && isEditablePhoto(image)) {
        preparePhoto(image, replacements, localUrlsRef.current);
        targetRef.current = image;
        backgroundTargetRef.current = null;
        layoutTargetRef.current = image;
        const key = image.dataset.photoEditorKey || "";
        image.dataset.photoEditorSelected = "true";
        setSelectedKey(key);
        setSelectedKind("photo");
        setSelectedLayout(layoutFor(key));
        return { key, target: image as HTMLElement };
      }
      if (background) {
        prepareBackground(background, replacements, localUrlsRef.current);
        targetRef.current = null;
        backgroundTargetRef.current = background;
        layoutTargetRef.current = background;
        const key = background.dataset.photoEditorKey || "";
        background.dataset.photoEditorSelected = "true";
        setSelectedKey(key);
        setSelectedKind("background");
        setSelectedLayout(layoutFor(key));
        return { key, target: background };
      }
      if (layoutElement && layoutKind) {
        prepareLayoutTarget(layoutElement, layoutKind);
        targetRef.current = null;
        backgroundTargetRef.current = null;
        layoutTargetRef.current = layoutElement;
        const key = layoutElement.dataset.photoEditorKey || "";
        const saved = readLayouts()[key];
        const layout = saved ? clampLayout(saved) : layoutForElement(layoutElement);
        layoutElement.dataset.photoEditorSelected = "true";
        setSelectedKey(key);
        setSelectedKind(layoutKind);
        setSelectedLayout(layout);
        return { key, target: layoutElement };
      }
      return null;
    };

    const handleContextMenu = (event: MouseEvent) => {
      const image = event.target instanceof HTMLImageElement ? event.target : null;
      const clickedElement = event.target instanceof Element ? event.target : null;
      const background = clickedElement?.closest<HTMLElement>("[data-photo-editor-background]") || null;
      if ((!image || !isEditablePhoto(image)) && !background) return;
      event.preventDefault();
      let currentSource = "";

      if (image && isEditablePhoto(image)) {
        const replacements = readReplacements();
        selectTarget(image, null);
        const key = image.dataset.photoEditorKey || "";
        currentSource = replacements[key] || image.getAttribute("src") || "";
      } else if (background) {
        const replacements = readReplacements();
        selectTarget(null, background);
        const key = background.dataset.photoEditorKey || "";
        currentSource = replacements[key] || background.dataset.photoEditorSource || "";
      }

      setQuery("");
      setGroup(assetGroup(currentSource));
      setNotice("");
      setOpen(true);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const clickedElement = event.target instanceof Element ? event.target : null;
      if (!clickedElement || clickedElement.closest("[data-photo-editor-ui]")) return;
      const sectionOverride = event.shiftKey ? clickedElement.closest<HTMLElement>("main section") : null;
      const image = !sectionOverride && event.target instanceof HTMLImageElement && isEditablePhoto(event.target) ? event.target : null;
      const text = !image && !sectionOverride ? isEditableText(clickedElement) : null;
      const background = !sectionOverride && !image && !text && !clickedElement.closest("a,button,input,select,textarea")
        ? clickedElement.closest<HTMLElement>("[data-photo-editor-background]")
        : null;
      const section = sectionOverride || (!image && !text && !background && !clickedElement.closest("a,button,input,select,textarea")
        ? clickedElement.closest<HTMLElement>("main section")
        : null);
      if (!image && !text && !background && !section) return;
      event.preventDefault();
      const selected = selectTarget(
        image,
        background,
        text || section,
        text ? "text" : section?.matches(".hero,.galleryHero") ? "header" : section ? "section" : null,
      );
      if (!selected?.key) return;
      if (section) return;
      dragRef.current = {
        key: selected.key,
        target: selected.target,
        startX: event.clientX,
        startY: event.clientY,
        initial: readLayouts()[selected.key] ? layoutFor(selected.key) : layoutForElement(selected.target),
      };
      document.body.classList.add("photoEditorDragging");
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = clampLayout({
        ...drag.initial,
        x: drag.initial.x + event.clientX - drag.startX,
        y: drag.initial.y + event.clientY - drag.startY,
      });
      applyLayout(drag.target, next);
      setSelectedLayout(next);
    };

    const finishDrag = () => {
      const drag = dragRef.current;
      if (!drag) return;
      const layouts = readLayouts();
      layouts[drag.key] = layoutForElement(drag.target);
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
      dragRef.current = null;
      document.body.classList.remove("photoEditorDragging");
      setNotice("Position saved on this computer.");
    };

    const preventEditedLink = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (element?.closest("a") && (element.closest("img[data-photo-editor-layout]") || isEditableText(element))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", finishDrag, true);
    window.addEventListener("pointercancel", finishDrag, true);
    window.addEventListener("click", preventEditedLink, true);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", finishDrag, true);
      window.removeEventListener("pointercancel", finishDrag, true);
      window.removeEventListener("click", preventEditedLink, true);
      document.body.classList.remove("photoEditorDragging");
    };
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!available) return null;

  const updateSelectedLayout = (nextLayout: PhotoLayout, message = "Layout saved on this computer.") => {
    const target = layoutTargetRef.current;
    if (!target || !selectedKey) return;
    const next = clampLayout(nextLayout);
    const layouts = readLayouts();
    layouts[selectedKey] = next;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    applyLayout(target, next);
    setSelectedLayout(next);
    setNotice(message);
  };

  const resetSelectedLayout = () => {
    const target = layoutTargetRef.current;
    if (!target || !selectedKey) return;
    const layouts = readLayouts();
    delete layouts[selectedKey];
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    applyLayout(target, DEFAULT_LAYOUT);
    setSelectedLayout(selectedKind === "section" || selectedKind === "header" ? layoutForElement(target) : DEFAULT_LAYOUT);
    setNotice(selectedKind === "section" ? "Original section spacing restored." : selectedKind === "header" ? "Original header height restored." : "Original size and position restored.");
  };

  const choosePhoto = (asset: EditorAsset) => {
    const target = targetRef.current;
    const background = backgroundTargetRef.current;
    if ((!target && !background) || !selectedKey) return;
    const replacements = readReplacements();
    replacements[selectedKey] = asset.key;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(replacements));
    if (target) target.setAttribute("src", asset.src);
    if (background) background.style.setProperty("--gallery-cover", `url('${asset.src}')`);
    setNotice("Photo replaced and saved on this computer.");
  };

  const restorePhoto = () => {
    const target = targetRef.current;
    const background = backgroundTargetRef.current;
    if ((!target && !background) || !selectedKey) return;
    const replacements = readReplacements();
    delete replacements[selectedKey];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(replacements));
    if (target) target.setAttribute("src", target.dataset.photoEditorOriginal || "");
    if (background) background.style.setProperty("--gallery-cover", `url('${background.dataset.photoEditorOriginal || ""}')`);
    setNotice("Original photo restored.");
  };

  const importPhotos = async (files: FileList | null) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".gif"));
    if (!imageFiles.length) {
      setNotice("Choose an image or animated GIF file.");
      return;
    }

    try {
      const records = await Promise.all(imageFiles.map(saveUpload));
      const added = records.map((record) => {
        const key = `local-upload:${record.id}`;
        const src = URL.createObjectURL(record.blob);
        localUrlsRef.current.set(key, src);
        return { ...record, key, src };
      });
      setUploads((current) => [...current, ...added]);
      setGroup("my uploads");
      setQuery("");
      setNotice(`${added.length} photo${added.length === 1 ? "" : "s"} added from this computer.`);
    } catch {
      setNotice("The selected photos could not be saved on this computer.");
    }
  };

  return (
    <div className="photoEditor" data-photo-editor-ui>
      <button
        className={`photoEditorToggle ${enabled ? "active" : ""}`}
        type="button"
        aria-pressed={enabled}
        onClick={() => {
          setEnabled((value) => {
            if (value) {
              setSelectedKey("");
              targetRef.current = null;
              backgroundTargetRef.current = null;
              layoutTargetRef.current = null;
              document.querySelectorAll<HTMLElement>("[data-photo-editor-selected]").forEach((element) => delete element.dataset.photoEditorSelected);
            }
            return !value;
          });
          setOpen(false);
          setNotice("");
        }}
      >
        <span>{enabled ? "●" : "○"}</span> Visual editor {enabled ? "on" : "off"}
      </button>

      {enabled && <p className="photoEditorHint">Drag photos or text · Shift-click a section or header for sizing</p>}

      {enabled && selectedKey && !open && (
        <aside className={`photoLayoutBar ${selectedKind === "section" || selectedKind === "header" ? "sectionControls" : ""}`} aria-label="Selected item layout controls">
          <div className="photoLayoutHeading">
            <span>Selected {selectedKind}</span>
            <strong>{selectedKind === "section" ? "Page spacing" : selectedKind === "header" ? `${Math.round(selectedLayout.height || 0)}px high` : `${Math.round(selectedLayout.scale * 100)}% size`}</strong>
          </div>
          {selectedKind !== "section" && selectedKind !== "header" ? (
            <>
              <div className="photoLayoutNudge" aria-label="Move selected item">
                <button type="button" onClick={() => updateSelectedLayout({ ...selectedLayout, y: selectedLayout.y - 10 })} aria-label="Move up">↑</button>
                <button type="button" onClick={() => updateSelectedLayout({ ...selectedLayout, x: selectedLayout.x - 10 })} aria-label="Move left">←</button>
                <button type="button" onClick={() => updateSelectedLayout({ ...selectedLayout, y: selectedLayout.y + 10 })} aria-label="Move down">↓</button>
                <button type="button" onClick={() => updateSelectedLayout({ ...selectedLayout, x: selectedLayout.x + 10 })} aria-label="Move right">→</button>
              </div>
              <label className="photoLayoutScale">
                <span>Resize</span>
                <input
                  type="range"
                  min="35"
                  max="250"
                  step="1"
                  value={Math.round(selectedLayout.scale * 100)}
                  onChange={(event) => updateSelectedLayout({ ...selectedLayout, scale: Number(event.target.value) / 100 })}
                />
              </label>
            </>
          ) : selectedKind === "section" ? (
            <div className="sectionSpacingControls">
              <label>
                <span>Space above · {Math.round(selectedLayout.paddingTop || 0)}px</span>
                <input type="range" min="0" max="400" value={Math.round(selectedLayout.paddingTop || 0)} onChange={(event) => updateSelectedLayout({ ...selectedLayout, paddingTop: Number(event.target.value) })} />
              </label>
              <label>
                <span>Space below · {Math.round(selectedLayout.paddingBottom || 0)}px</span>
                <input type="range" min="0" max="400" value={Math.round(selectedLayout.paddingBottom || 0)} onChange={(event) => updateSelectedLayout({ ...selectedLayout, paddingBottom: Number(event.target.value) })} />
              </label>
            </div>
          ) : (
            <div className="sectionSpacingControls headerHeightControl">
              <label>
                <span>Header height · {Math.round(selectedLayout.height || 0)}px</span>
                <input type="range" min="360" max="1400" value={Math.round(selectedLayout.height || 720)} onChange={(event) => updateSelectedLayout({ ...selectedLayout, height: Number(event.target.value) })} />
              </label>
            </div>
          )}
          {(selectedKind === "photo" || selectedKind === "background") && <button type="button" className="photoLayoutChange" onClick={() => setOpen(true)}>Change photo</button>}
          <button type="button" className="photoLayoutReset" onClick={resetSelectedLayout}>Reset layout</button>
        </aside>
      )}

      {open && (
        <div className="photoEditorBackdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="photoEditorPanel" role="dialog" aria-modal="true" aria-labelledby="photo-editor-title">
            <header>
              <div>
                <p className="kicker">Local visual editor</p>
                <h2 id="photo-editor-title">CHOOSE A <span>PHOTO.</span></h2>
              </div>
              <button className="photoEditorClose" type="button" onClick={() => setOpen(false)} aria-label="Close photo editor">×</button>
            </header>

            <div className="photoEditorTools">
              <label>
                <span>Collection</span>
                <select value={group} onChange={(event) => setGroup(event.target.value)}>
                  {groups.map((name) => <option value={name} key={name}>{name === "all" ? "All site photos" : name.replaceAll("-", " ")}</option>)}
                </select>
              </label>
              <label>
                <span>Find a photo</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename or collection" />
              </label>
              <label className="photoEditorUpload">
                Add from computer
                <input type="file" accept="image/*,.gif" multiple onChange={(event) => {
                  void importPhotos(event.target.files);
                  event.target.value = "";
                }} />
              </label>
              <button type="button" className="photoEditorRestore" onClick={restorePhoto}>Restore original</button>
            </div>

            <div className="photoEditorStatus" aria-live="polite">
              <span>{filteredAssets.length} photos available</span>
              {notice && <strong>{notice}</strong>}
            </div>

            <div className="photoEditorGrid">
              {filteredAssets.map((asset) => (
                <button type="button" key={asset.key} onClick={() => choosePhoto(asset)} title={`Use ${asset.label}`}>
                  <img src={asset.src} alt="" loading="lazy" />
                  <span>{asset.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
