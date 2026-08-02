"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "gabytron-photo-replacements-v1";
const LAYOUT_STORAGE_KEY = "gabytron-photo-layouts-v1";
const TEXT_STORAGE_KEY = "gabytron-text-content-v1";
const UNDO_STORAGE_KEY = "gabytron-editor-undo-v1";
const REOPEN_EDITOR_KEY = "gabytron-editor-reopen";
const UPLOAD_DB = "gabytron-photo-editor";
const UPLOAD_STORE = "uploads";

type ReplacementMap = Record<string, string>;
type TextMap = Record<string, string>;
type EditorSnapshot = { layouts: LayoutMap; texts: TextMap; replacements: ReplacementMap };
type EditorKind = "photo" | "background" | "text" | "section" | "header" | "box";
type PhotoLayout = { x: number; y: number; scale: number; widthScale?: number; heightScale?: number; fontSize?: number; paddingTop?: number; paddingBottom?: number; height?: number };
type LayoutMap = Record<string, PhotoLayout>;
type StoredUpload = { id: string; name: string; type: string; blob: Blob };
type UploadAsset = StoredUpload & { key: string; src: string };
type EditorAsset = { key: string; src: string; group: string; label: string };
type SelectionRect = { top: number; left: number; width: number; height: number };
type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

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

function readTexts(): TextMap {
  try {
    return JSON.parse(window.localStorage.getItem(TEXT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function readUndoHistory(): EditorSnapshot[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(UNDO_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function currentEditorSnapshot(): EditorSnapshot {
  return { layouts: readLayouts(), texts: readTexts(), replacements: readReplacements() };
}

function cleanEditableHtml(element: HTMLElement) {
  const allowed = new Set(["BR", "SPAN", "EM", "STRONG"]);
  const container = document.createElement("div");
  const appendClean = (source: Node, destination: Node) => {
    if (source.nodeType === Node.TEXT_NODE) {
      destination.appendChild(document.createTextNode(source.textContent || ""));
      return;
    }
    if (!(source instanceof HTMLElement)) return;
    if (source.tagName === "DIV" || source.tagName === "P") {
      if (destination.hasChildNodes()) destination.appendChild(document.createElement("br"));
      source.childNodes.forEach((child) => appendClean(child, destination));
      return;
    }
    if (allowed.has(source.tagName)) {
      const clean = document.createElement(source.tagName.toLowerCase());
      source.childNodes.forEach((child) => appendClean(child, clean));
      destination.appendChild(clean);
      return;
    }
    source.childNodes.forEach((child) => appendClean(child, destination));
  };
  element.childNodes.forEach((child) => appendClean(child, container));
  return container.innerHTML.trim();
}

function clampLayout(layout: PhotoLayout): PhotoLayout {
  return {
    x: Math.max(-1000, Math.min(1000, Math.round(layout.x))),
    y: Math.max(-1000, Math.min(1000, Math.round(layout.y))),
    scale: Math.max(0.35, Math.min(2.5, Math.round(layout.scale * 100) / 100)),
    ...(layout.widthScale === undefined ? {} : { widthScale: Math.max(0.35, Math.min(2.5, Math.round(layout.widthScale * 100) / 100)) }),
    ...(layout.heightScale === undefined ? {} : { heightScale: Math.max(0.35, Math.min(2.5, Math.round(layout.heightScale * 100) / 100)) }),
    ...(layout.fontSize === undefined ? {} : { fontSize: Math.max(8, Math.min(240, Math.round(layout.fontSize))) }),
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
  element.style.setProperty("--photo-editor-width-scale", `${layout.widthScale || 1}`);
  element.style.setProperty("--photo-editor-height-scale", `${layout.heightScale || 1}`);
  if (element.dataset.photoEditorKind === "section") {
    if (layout.paddingTop === undefined) element.style.removeProperty("padding-top");
    else element.style.paddingTop = `${layout.paddingTop}px`;
    if (layout.paddingBottom === undefined) element.style.removeProperty("padding-bottom");
    else element.style.paddingBottom = `${layout.paddingBottom}px`;
  }
  if (element.dataset.photoEditorKind === "text") {
    if (layout.fontSize === undefined) element.style.removeProperty("font-size");
    else element.style.fontSize = `${layout.fontSize}px`;
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
    widthScale: Number.parseFloat(element.style.getPropertyValue("--photo-editor-width-scale")) || 1,
    heightScale: Number.parseFloat(element.style.getPropertyValue("--photo-editor-height-scale")) || 1,
    ...(element.dataset.photoEditorKind === "text" ? {
      fontSize: Number.parseFloat(element.style.fontSize) || Number.parseFloat(window.getComputedStyle(element).fontSize) || 16,
    } : {}),
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
  const text = element.closest<HTMLElement>("h1,h2,h3,p,.roundel,.artistPortrait>span");
  if (!text || text.closest("[data-photo-editor-ui],nav,footer")) return null;
  return text;
}

function prepareLayoutTarget(element: HTMLElement, kind: "text" | "section" | "header" | "box") {
  if (!element.dataset.photoEditorKey) {
    const specialText = kind === "text" && element.matches(".roundel,.artistPortrait>span");
    const selector = kind === "text" ? (specialText ? ".roundel,.artistPortrait>span" : "h1,h2,h3,p") : kind === "header" ? ".hero,.galleryHero" : kind === "box" ? ".serviceCard,.aboutImageFrame" : "main section:not(.hero):not(.galleryHero)";
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((target) => !target.closest("[data-photo-editor-ui],nav,footer"));
    element.dataset.photoEditorKey = `${window.location.pathname}::${specialText ? "text-label" : kind}-${targets.indexOf(element)}::${element.tagName.toLowerCase()}`;
  }
  element.dataset.photoEditorKind = kind;
  if (kind === "text" && !element.isContentEditable) {
    const savedText = readTexts()[element.dataset.photoEditorKey];
    if (savedText !== undefined && element.innerHTML !== savedText) element.innerHTML = savedText;
  }
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
  const [editingText, setEditingText] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [uploads, setUploads] = useState<UploadAsset[]>([]);
  const targetRef = useRef<HTMLImageElement | null>(null);
  const backgroundTargetRef = useRef<HTMLElement | null>(null);
  const layoutTargetRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ key: string; target: HTMLElement; startX: number; startY: number; initial: PhotoLayout } | null>(null);
  const resizeDragRef = useRef<{ key: string; target: HTMLElement; direction: ResizeDirection; startX: number; startY: number; initial: PhotoLayout; rect: DOMRect } | null>(null);
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

  const recordHistory = () => {
    const history = readUndoHistory();
    const snapshot = currentEditorSnapshot();
    const serialized = JSON.stringify(snapshot);
    if (history.length === 0 || JSON.stringify(history[history.length - 1]) !== serialized) {
      history.push(snapshot);
      if (history.length > 50) history.shift();
      window.sessionStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(history));
      setUndoCount(history.length);
    }
  };

  const undoLastEdit = () => {
    const history = readUndoHistory();
    const snapshot = history.pop();
    if (!snapshot) {
      setNotice("Nothing to undo yet.");
      return;
    }
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(snapshot.layouts));
    window.localStorage.setItem(TEXT_STORAGE_KEY, JSON.stringify(snapshot.texts));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.replacements));
    window.sessionStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(history));
    window.sessionStorage.setItem(REOPEN_EDITOR_KEY, "true");
    window.location.reload();
  };

  useEffect(() => {
    const local = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setAvailable(local);
    if (!local) return;
    setUndoCount(readUndoHistory().length);
    if (window.sessionStorage.getItem(REOPEN_EDITOR_KEY) === "true") {
      window.sessionStorage.removeItem(REOPEN_EDITOR_KEY);
      setEnabled(true);
    }

    let stopped = false;
    const applySavedPhotos = () => {
      const replacements = readReplacements();
      document.querySelectorAll<HTMLImageElement>("img").forEach((image) => preparePhoto(image, replacements, localUrlsRef.current));
      document.querySelectorAll<HTMLElement>("[data-photo-editor-background]").forEach((element) => prepareBackground(element, replacements, localUrlsRef.current));
      document.querySelectorAll<HTMLElement>("h1,h2,h3,p,.roundel,.artistPortrait>span").forEach((element) => {
        if (!element.closest("[data-photo-editor-ui],nav,footer")) prepareLayoutTarget(element, "text");
      });
      document.querySelectorAll<HTMLElement>("main section:not(.hero):not(.galleryHero)").forEach((element) => prepareLayoutTarget(element, "section"));
      document.querySelectorAll<HTMLElement>(".hero,.galleryHero").forEach((element) => prepareLayoutTarget(element, "header"));
      document.querySelectorAll<HTMLElement>(".serviceCard,.aboutImageFrame").forEach((element) => prepareLayoutTarget(element, "box"));
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
      layoutKind: "text" | "section" | "header" | "box" | null = null,
    ) => {
      const replacements = readReplacements();
      document.querySelectorAll<HTMLElement>("[data-photo-editor-selected]").forEach((element) => delete element.dataset.photoEditorSelected);
      document.querySelectorAll<HTMLElement>("[contenteditable='true'][data-photo-editor-kind='text']").forEach((element) => {
        element.contentEditable = "false";
      });
      setEditingText(false);
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
        const measured = layoutForElement(layoutElement);
        const layout = saved ? clampLayout({ ...measured, ...saved }) : measured;
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
      const selectedBox = clickedElement.closest<HTMLElement>(".serviceCard[data-photo-editor-selected],.aboutImageFrame[data-photo-editor-selected]");
      const textCandidate = selectedBox ? null : isEditableText(clickedElement);
      if (textCandidate?.isContentEditable) return;
      const headerTarget = !selectedBox && !textCandidate ? clickedElement.closest<HTMLElement>(".hero,.galleryHero") : null;
      const sectionOverride = event.shiftKey ? clickedElement.closest<HTMLElement>("main section") : headerTarget;
      const image = !selectedBox && !sectionOverride && event.target instanceof HTMLImageElement && isEditablePhoto(event.target) ? event.target : null;
      const text = !image && !sectionOverride ? textCandidate : null;
      const background = !selectedBox && !sectionOverride && !image && !text && !clickedElement.closest("a,button,input,select,textarea")
        ? clickedElement.closest<HTMLElement>("[data-photo-editor-background]")
        : null;
      const section = !selectedBox && (sectionOverride || (!image && !text && !background && !clickedElement.closest("a,button,input,select,textarea")
        ? clickedElement.closest<HTMLElement>("main section")
        : null));
      if (!image && !text && !background && !section && !selectedBox) return;
      event.preventDefault();
      const selected = selectTarget(
        image,
        background,
        selectedBox || text || section,
        selectedBox ? "box" : text ? "text" : section?.matches(".hero,.galleryHero") ? "header" : section ? "section" : null,
      );
      if (!selected?.key) return;
      if (section) return;
      recordHistory();
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
    if (!enabled || !selectedKey || open) {
      setSelectionRect(null);
      return;
    }
    const target = layoutTargetRef.current;
    if (!target) return;
    const updateSelectionRect = () => {
      const rect = target.getBoundingClientRect();
      setSelectionRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    const frame = window.requestAnimationFrame(updateSelectionRect);
    const observer = new ResizeObserver(updateSelectionRect);
    observer.observe(target);
    window.addEventListener("scroll", updateSelectionRect, true);
    window.addEventListener("resize", updateSelectionRect);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateSelectionRect, true);
      window.removeEventListener("resize", updateSelectionRect);
    };
  }, [enabled, open, selectedKey, selectedLayout]);

  useEffect(() => {
    if (!enabled) return;
    const handleResizeMove = (event: PointerEvent) => {
      const resize = resizeDragRef.current;
      if (!resize) return;
      event.preventDefault();
      const deltaX = event.clientX - resize.startX;
      const deltaY = event.clientY - resize.startY;
      let next: PhotoLayout;

      if (resize.target.dataset.photoEditorKind === "header") {
        const verticalDelta = resize.direction.includes("n") ? -deltaY : deltaY;
        next = clampLayout({ ...resize.initial, height: (resize.initial.height || resize.rect.height) + verticalDelta });
      } else if (resize.direction === "e" || resize.direction === "w") {
        const horizontalDelta = resize.direction === "w" ? -deltaX : deltaX;
        next = clampLayout({
          ...resize.initial,
          widthScale: (resize.initial.widthScale || 1) * (1 + horizontalDelta / Math.max(1, resize.rect.width)),
        });
      } else if (resize.direction === "n" || resize.direction === "s") {
        const verticalDelta = resize.direction === "n" ? -deltaY : deltaY;
        next = clampLayout({
          ...resize.initial,
          heightScale: (resize.initial.heightScale || 1) * (1 + verticalDelta / Math.max(1, resize.rect.height)),
        });
      } else {
        const changes: number[] = [];
        if (resize.direction.includes("e")) changes.push(deltaX / Math.max(1, resize.rect.width));
        if (resize.direction.includes("w")) changes.push(-deltaX / Math.max(1, resize.rect.width));
        if (resize.direction.includes("s")) changes.push(deltaY / Math.max(1, resize.rect.height));
        if (resize.direction.includes("n")) changes.push(-deltaY / Math.max(1, resize.rect.height));
        const scaleChange = changes.reduce((sum, value) => sum + value, 0) / Math.max(1, changes.length);
        next = clampLayout({ ...resize.initial, scale: resize.initial.scale * (1 + scaleChange) });
      }

      applyLayout(resize.target, next);
      setSelectedLayout(next);
    };

    const finishResize = () => {
      const resize = resizeDragRef.current;
      if (!resize) return;
      const layouts = readLayouts();
      layouts[resize.key] = layoutForElement(resize.target);
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
      resizeDragRef.current = null;
      document.body.classList.remove("photoEditorDragging");
      setNotice("Mouse resize saved on this computer.");
    };

    window.addEventListener("pointermove", handleResizeMove, true);
    window.addEventListener("pointerup", finishResize, true);
    window.addEventListener("pointercancel", finishResize, true);
    return () => {
      window.removeEventListener("pointermove", handleResizeMove, true);
      window.removeEventListener("pointerup", finishResize, true);
      window.removeEventListener("pointercancel", finishResize, true);
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
    recordHistory();
    const layouts = readLayouts();
    delete layouts[selectedKey];
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    applyLayout(target, DEFAULT_LAYOUT);
    setSelectedLayout(selectedKind === "section" || selectedKind === "header" || selectedKind === "text" ? layoutForElement(target) : DEFAULT_LAYOUT);
    setNotice(selectedKind === "section" ? "Original section spacing restored." : selectedKind === "header" ? "Original header height restored." : "Original size and position restored.");
  };

  const beginTextEditing = () => {
    const target = layoutTargetRef.current;
    if (!target || selectedKind !== "text") return;
    recordHistory();
    target.contentEditable = "true";
    target.spellcheck = true;
    target.focus();
    setEditingText(true);
    setNotice("Type directly in the selected text, then choose Save selected.");
  };

  const saveSelectedChanges = () => {
    const target = layoutTargetRef.current;
    if (!target || !selectedKey) return;
    const layouts = readLayouts();
    layouts[selectedKey] = layoutForElement(target);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));

    if (selectedKind === "text") {
      const texts = readTexts();
      const cleanText = cleanEditableHtml(target);
      texts[selectedKey] = cleanText;
      window.localStorage.setItem(TEXT_STORAGE_KEY, JSON.stringify(texts));
      target.innerHTML = cleanText;
      target.contentEditable = "false";
      setEditingText(false);
    }
    setNotice("Selected changes saved on this computer.");
  };

  const exportEditorChanges = () => {
    const replacements = readReplacements();
    const localUploadReferences = Object.entries(replacements)
      .filter(([, source]) => source.startsWith("local-upload:"))
      .map(([key]) => key);
    const exportData = {
      version: 1,
      site: "Gabytron Productions",
      exportedAt: new Date().toISOString(),
      layouts: readLayouts(),
      texts: readTexts(),
      replacements,
      localUploadReferences,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gabytron-editor-changes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(localUploadReferences.length > 0
      ? "Edits exported. Attach the JSON and any newly uploaded photos here."
      : "Edits exported. Attach the JSON file here so it can be published.");
  };

  const startMouseResize = (event: React.PointerEvent<HTMLButtonElement>, direction: ResizeDirection) => {
    const target = layoutTargetRef.current;
    if (!target || !selectedKey) return;
    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    resizeDragRef.current = {
      key: selectedKey,
      target,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      initial: readLayouts()[selectedKey] ? layoutFor(selectedKey) : layoutForElement(target),
      rect: target.getBoundingClientRect(),
    };
    document.body.classList.add("photoEditorDragging");
  };

  const selectRelatedBox = () => {
    const box = layoutTargetRef.current?.closest<HTMLElement>(".serviceCard,.aboutImageFrame");
    if (!box) return;
    prepareLayoutTarget(box, "box");
    document.querySelectorAll<HTMLElement>("[data-photo-editor-selected]").forEach((element) => delete element.dataset.photoEditorSelected);
    box.dataset.photoEditorSelected = "true";
    targetRef.current = null;
    backgroundTargetRef.current = null;
    layoutTargetRef.current = box;
    const key = box.dataset.photoEditorKey || "";
    setSelectedKey(key);
    setSelectedKind("box");
    setSelectedLayout(readLayouts()[key] ? layoutFor(key) : layoutForElement(box));
    setNotice("Box selected. Resize or move the whole service card.");
  };

  const selectPhotoInsideBox = () => {
    const box = layoutTargetRef.current;
    const image = box?.querySelector<HTMLImageElement>("img") || null;
    if (!image || !isEditablePhoto(image)) return;
    preparePhoto(image, readReplacements(), localUrlsRef.current);
    document.querySelectorAll<HTMLElement>("[data-photo-editor-selected]").forEach((element) => delete element.dataset.photoEditorSelected);
    image.dataset.photoEditorSelected = "true";
    targetRef.current = image;
    backgroundTargetRef.current = null;
    layoutTargetRef.current = image;
    const key = image.dataset.photoEditorKey || "";
    setSelectedKey(key);
    setSelectedKind("photo");
    setSelectedLayout(layoutFor(key));
    setNotice("Photo selected. Resize it independently inside the box.");
  };

  const choosePhoto = (asset: EditorAsset) => {
    const target = targetRef.current;
    const background = backgroundTargetRef.current;
    if ((!target && !background) || !selectedKey) return;
    recordHistory();
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
    recordHistory();
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
          if (!enabled && readUndoHistory().length === 0) recordHistory();
          setEnabled((value) => {
            if (value) {
              setSelectedKey("");
              targetRef.current = null;
              backgroundTargetRef.current = null;
              layoutTargetRef.current = null;
              document.querySelectorAll<HTMLElement>("[contenteditable='true'][data-photo-editor-kind='text']").forEach((element) => {
                element.contentEditable = "false";
              });
              setEditingText(false);
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

      {enabled && <p className="photoEditorHint">Click a header to resize · drag photos or text · Shift-click other sections</p>}
      {enabled && (
        <button type="button" className="photoEditorUndo" onClick={undoLastEdit} disabled={undoCount === 0}>
          Undo{undoCount > 0 ? ` (${undoCount})` : ""}
        </button>
      )}
      {enabled && <button type="button" className="photoEditorExport" onClick={exportEditorChanges}>Export edits ↓</button>}

      {enabled && selectionRect && selectedKind !== "section" && !open && (
        <div
          className={`visualSelectionBox ${selectedKind === "header" ? "headerSelectionBox" : ""}`}
          style={{ top: selectionRect.top, left: selectionRect.left, width: selectionRect.width, height: selectionRect.height }}
          aria-hidden="true"
        >
          {(selectedKind === "header" ? ["n", "s"] : ["n", "ne", "e", "se", "s", "sw", "w", "nw"]).map((direction) => (
            <button
              type="button"
              className="visualResizeHandle"
              data-direction={direction}
              key={direction}
              tabIndex={-1}
              aria-label={`Resize from ${direction}`}
              onPointerDown={(event) => startMouseResize(event, direction as ResizeDirection)}
            />
          ))}
        </div>
      )}

      {enabled && selectedKey && !open && (
        <aside className={`photoLayoutBar ${selectedKind === "section" || selectedKind === "header" ? "sectionControls" : ""}`} aria-label="Selected item layout controls">
          <div className="photoLayoutHeading">
            <span>Selected {selectedKind}</span>
            <strong>{selectedKind === "section" ? "Page spacing" : selectedKind === "header" ? `${Math.round(selectedLayout.height || 0)}px high` : `${Math.round(selectedLayout.scale * 100)}% size`}</strong>
          </div>
          {selectedKind !== "section" && selectedKind !== "header" ? (
            <>
              <div className="photoLayoutNudge" aria-label="Move selected item">
                <button type="button" onPointerDown={recordHistory} onClick={() => updateSelectedLayout({ ...selectedLayout, y: selectedLayout.y - 10 })} aria-label="Move up">↑</button>
                <button type="button" onPointerDown={recordHistory} onClick={() => updateSelectedLayout({ ...selectedLayout, x: selectedLayout.x - 10 })} aria-label="Move left">←</button>
                <button type="button" onPointerDown={recordHistory} onClick={() => updateSelectedLayout({ ...selectedLayout, y: selectedLayout.y + 10 })} aria-label="Move down">↓</button>
                <button type="button" onPointerDown={recordHistory} onClick={() => updateSelectedLayout({ ...selectedLayout, x: selectedLayout.x + 10 })} aria-label="Move right">→</button>
              </div>
              <label className="photoLayoutScale">
                <span>Resize</span>
                <input
                  type="range"
                  min="35"
                  max="250"
                  step="1"
                  value={Math.round(selectedLayout.scale * 100)}
                  onPointerDown={recordHistory}
                  onKeyDown={recordHistory}
                  onChange={(event) => updateSelectedLayout({ ...selectedLayout, scale: Number(event.target.value) / 100 })}
                />
              </label>
            </>
          ) : selectedKind === "section" ? (
            <div className="sectionSpacingControls">
              <label>
                <span>Space above · {Math.round(selectedLayout.paddingTop || 0)}px</span>
                <input type="range" min="0" max="400" value={Math.round(selectedLayout.paddingTop || 0)} onPointerDown={recordHistory} onKeyDown={recordHistory} onChange={(event) => updateSelectedLayout({ ...selectedLayout, paddingTop: Number(event.target.value) })} />
              </label>
              <label>
                <span>Space below · {Math.round(selectedLayout.paddingBottom || 0)}px</span>
                <input type="range" min="0" max="400" value={Math.round(selectedLayout.paddingBottom || 0)} onPointerDown={recordHistory} onKeyDown={recordHistory} onChange={(event) => updateSelectedLayout({ ...selectedLayout, paddingBottom: Number(event.target.value) })} />
              </label>
            </div>
          ) : (
            <div className="sectionSpacingControls headerHeightControl">
              <label>
                <span>Header height · {Math.round(selectedLayout.height || 0)}px</span>
                <input type="range" min="360" max="1400" value={Math.round(selectedLayout.height || 720)} onPointerDown={recordHistory} onKeyDown={recordHistory} onChange={(event) => updateSelectedLayout({ ...selectedLayout, height: Number(event.target.value) })} />
              </label>
            </div>
          )}
          {selectedKind === "text" && (
            <label className="photoLayoutScale textFontSizeControl">
              <span>Font · {Math.round(selectedLayout.fontSize || 16)}px</span>
              <input
                type="range"
                min="8"
                max="240"
                step="1"
                value={Math.round(selectedLayout.fontSize || 16)}
                onPointerDown={recordHistory}
                onKeyDown={recordHistory}
                onChange={(event) => updateSelectedLayout({ ...selectedLayout, fontSize: Number(event.target.value) })}
              />
            </label>
          )}
          {selectedKind === "text" && <button type="button" className="photoLayoutChange" onClick={beginTextEditing}>{editingText ? "Editing text…" : "Edit text"}</button>}
          {selectedKind === "photo" && targetRef.current?.closest(".serviceCard,.aboutImageFrame") && <button type="button" className="photoLayoutChange" onClick={selectRelatedBox}>Resize box</button>}
          {selectedKind === "box" && <button type="button" className="photoLayoutChange" onClick={selectPhotoInsideBox}>Resize photo</button>}
          {(selectedKind === "photo" || selectedKind === "background") && <button type="button" className="photoLayoutChange" onClick={() => setOpen(true)}>Change photo</button>}
          <button type="button" className="photoLayoutSave" onClick={saveSelectedChanges}>Save selected</button>
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
