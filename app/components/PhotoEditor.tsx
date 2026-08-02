"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "gabytron-photo-replacements-v1";
const UPLOAD_DB = "gabytron-photo-editor";
const UPLOAD_STORE = "uploads";

type ReplacementMap = Record<string, string>;
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
  const resolved = replacement ? resolveSource(replacement, localUrls) : "";
  if (resolved && image.getAttribute("src") !== resolved) image.setAttribute("src", resolved);
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
  const resolved = replacement ? resolveSource(replacement, localUrls) : "";
  if (resolved) element.style.setProperty("--gallery-cover", `url('${resolved}')`);
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

export function PhotoEditor({ assets }: { assets: string[] }) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedKey, setSelectedKey] = useState("");
  const [notice, setNotice] = useState("");
  const [uploads, setUploads] = useState<UploadAsset[]>([]);
  const targetRef = useRef<HTMLImageElement | null>(null);
  const backgroundTargetRef = useRef<HTMLElement | null>(null);
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

    const handleContextMenu = (event: MouseEvent) => {
      const image = event.target instanceof HTMLImageElement ? event.target : null;
      const clickedElement = event.target instanceof Element ? event.target : null;
      const background = clickedElement?.closest<HTMLElement>("[data-photo-editor-background]") || null;
      if ((!image || !isEditablePhoto(image)) && !background) return;
      event.preventDefault();
      const replacements = readReplacements();
      let currentSource = "";

      if (image && isEditablePhoto(image)) {
        preparePhoto(image, replacements, localUrlsRef.current);
        targetRef.current = image;
        backgroundTargetRef.current = null;
        const key = image.dataset.photoEditorKey || "";
        setSelectedKey(key);
        currentSource = replacements[key] || image.getAttribute("src") || "";
      } else if (background) {
        prepareBackground(background, replacements, localUrlsRef.current);
        targetRef.current = null;
        backgroundTargetRef.current = background;
        const key = background.dataset.photoEditorKey || "";
        setSelectedKey(key);
        currentSource = replacements[key] || background.dataset.photoEditorSource || "";
      }

      setQuery("");
      setGroup(assetGroup(currentSource));
      setNotice("");
      setOpen(true);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
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
          setEnabled((value) => !value);
          setOpen(false);
          setNotice("");
        }}
      >
        <span>{enabled ? "●" : "○"}</span> Photo editor {enabled ? "on" : "off"}
      </button>

      {enabled && <p className="photoEditorHint">Right-click a photo to replace it</p>}

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
