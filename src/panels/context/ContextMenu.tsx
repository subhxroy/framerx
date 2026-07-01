import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { Element } from "@/store/editorStore";
import {
  Copy, ClipboardPaste, Trash2, CopyPlus,
  ArrowUp, ArrowDown, BringToFront, SendToBack,
  Group, Ungroup, Palette,
} from "lucide-react";

import { setClipboard, getClipboard } from "@/lib/clipboard";

interface Props {
  x: number;
  y: number;
  elementId: string;
  onClose: () => void;
}

export default function ContextMenu({ x, y, elementId, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const groupSelection = useEditorStore((s) => s.groupSelection);
  const ungroup = useEditorStore((s) => s.ungroup);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const updateElement = useEditorStore((s) => s.updateElement);
  const elements = useEditorStore((s) => s.elements);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const styleClipboard = useRef<Record<string, any>>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const stored = sessionStorage.getItem("framer_style_clipboard");
    if (stored) {
      try { styleClipboard.current = JSON.parse(stored); } catch { /* ignore */ }
    }
  }, []);

  const isMulti = selectedIds.length > 1 && selectedIds.includes(elementId);
  const target = elements[elementId];
  const canUngroup = !!target && target.children.length > 0;
  const componentAction = useEditorStore((s) => s.createComponent);
  const canCreateComponent = target && !target.componentId && selectedIds.length <= 1;
  const mod = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";

  type MenuItem =
    | { label: string; icon: React.ReactNode; action: () => void; disabled?: boolean; shortcut?: string }
    | { separator: true };

  const menuItems: MenuItem[] = [
    {
      label: "Copy Elements",
      icon: <Copy size={12} />,
      shortcut: `${mod}C`,
      action: () => {
        if (!isMulti) useEditorStore.getState().setSelectedIds([elementId]);
        const store = useEditorStore.getState();
        const ids = store.selectedIds;
        const items: Element[] = [];
        for (const sid of ids) {
          const stack = [sid];
          while (stack.length) {
            const cur = stack.pop()!;
            const node = store.elements[cur];
            if (!node) continue;
            items.push(JSON.parse(JSON.stringify(node)));
            stack.push(...node.children);
          }
        }
        setClipboard(items);
        onClose();
      },
    },
    {
      label: "Paste Elements",
      icon: <ClipboardPaste size={12} />,
      shortcut: `${mod}V`,
      action: () => {
        const store = useEditorStore.getState();
        const clipboard = getClipboard();
        if (clipboard.length === 0) { onClose(); return; }
        store.pushHistory();
        const partIds = new Set(clipboard.map((p) => p.id));
        const roots = clipboard.filter(
          (p) => !p.parentId || !partIds.has(p.parentId)
        );
        const newIds: string[] = [];
        for (const root of roots) {
          const subtree: Element[] = [];
          const stack = [root.id];
          while (stack.length) {
            const cur = stack.pop();
            const node = clipboard.find((e) => e.id === cur);
            if (!node) continue;
            subtree.push(node);
            stack.push(...(node.children || []));
          }
          const detached = subtree.map((p) =>
            p.id === root.id ? { ...p, parentId: null } : p
          );
          const newRootId = store.addElementTree(detached, root.id);
          const rootEl = useEditorStore.getState().elements[newRootId];
          if (rootEl) {
            useEditorStore.getState().updateElement(newRootId, {
              name: rootEl.name + " Copy",
              x: rootEl.x + 20,
              y: rootEl.y + 20,
            });
          }
          newIds.push(newRootId);
        }
        store.setSelectedIds(newIds);
        onClose();
      },
    },
    {
      label: "Duplicate",
      icon: <CopyPlus size={12} />,
      shortcut: `${mod}D`,
      action: () => {
        pushHistory();
        duplicateElement(elementId);
        onClose();
      },
    },
    {
      label: "Delete",
      icon: <Trash2 size={12} />,
      shortcut: "Del",
      action: () => {
        const ids = isMulti ? selectedIds : [elementId];
        pushHistory();
        for (const id of ids) deleteElement(id);
        onClose();
      },
    },
    { separator: true },
    {
      label: "Group",
      icon: <Group size={12} />,
      shortcut: `${mod}G`,
      action: () => {
        if (!isMulti) useEditorStore.getState().setSelectedIds([elementId]);
        pushHistory();
        groupSelection();
        onClose();
      },
    },
    {
      label: "Ungroup",
      icon: <Ungroup size={12} />,
      shortcut: `${mod}⇧G`,
      disabled: !canUngroup,
      action: () => {
        pushHistory();
        ungroup(elementId);
        onClose();
      },
    },
    { separator: true },
    {
      label: "Bring to Front",
      icon: <BringToFront size={12} />,
      shortcut: "]",
      action: () => { pushHistory(); bringToFront(elementId); onClose(); },
    },
    {
      label: "Bring Forward",
      icon: <ArrowUp size={12} />,
      action: () => { pushHistory(); bringForward(elementId); onClose(); },
    },
    {
      label: "Send Backward",
      icon: <ArrowDown size={12} />,
      action: () => { pushHistory(); sendBackward(elementId); onClose(); },
    },
    {
      label: "Send to Back",
      icon: <SendToBack size={12} />,
      shortcut: "[",
      action: () => { pushHistory(); sendToBack(elementId); onClose(); },
    },
    { separator: true },
    ...(canCreateComponent
      ? [{
          label: "Create Component",
          icon: <CopyPlus size={12} />,
          action: () => {
            pushHistory();
            componentAction(elementId);
            onClose();
          },
        } as MenuItem]
      : []),
    { separator: true },
    {
      label: "Copy Styles",
      icon: <Palette size={12} />,
      action: () => {
        const el = elements[elementId];
        if (!el) return;
        const styles = {
          style: { ...el.style },
          text: el.text ? { ...el.text } : undefined,
          autoLayout: el.autoLayout ? { ...el.autoLayout } : undefined,
          opacity: el.opacity,
          rotation: el.rotation,
        };
        sessionStorage.setItem("framer_style_clipboard", JSON.stringify(styles));
        styleClipboard.current = styles;
        onClose();
      },
    },
    {
      label: "Paste Styles",
      icon: <Palette size={12} />,
      action: () => {
        if (!styleClipboard.current) return;
        pushHistory();
        const ids = isMulti ? selectedIds : [elementId];
        for (const id of ids) {
          updateElement(id, styleClipboard.current);
        }
        onClose();
      },
      disabled: !styleClipboard.current,
    },
  ];

  const menuX = Math.min(x, window.innerWidth - 220);
  const menuY = Math.min(y, window.innerHeight - 460);

  return (
    <div
      ref={ref}
      className="fixed z-[100] rounded-lg overflow-hidden py-1"
      style={{
        left: menuX,
        top: menuY,
        minWidth: 200,
        background: "#1c1c1c",
        border: "1px solid #2a2a2a",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {menuItems.map((item, i) => {
        if ("separator" in item) {
          return <div key={i} style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} />;
        }
        return (
          <button
            key={i}
            className="flex items-center gap-2 w-full text-xs px-3 py-1.5 text-left"
            style={{
              color: item.disabled ? "#555" : "#ccc",
              background: "transparent",
              border: "none",
              cursor: item.disabled ? "default" : "pointer",
            }}
            onMouseEnter={(e) => { if (!item.disabled) (e.currentTarget as HTMLElement).style.background = "#2a2a2a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={item.disabled ? undefined : item.action}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span style={{ color: "#555", fontSize: 11 }}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
