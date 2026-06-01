'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useRef, useState } from 'react'
import {
  Bold, Italic, UnderlineIcon, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Minus, Video,
  Undo, Redo, Code, Upload, X, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Custom iframe embed node (Loom, Google Drive, etc.) ────────────────────────
const IframeEmbed = Node.create({
  name: 'iframeEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:   { default: null },
      title: { default: 'Video' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-iframe-embed]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-iframe-embed': '' }, HTMLAttributes),
      ['iframe', {
        src: HTMLAttributes.src,
        title: HTMLAttributes.title,
        frameborder: '0',
        allowfullscreen: 'true',
        allow: 'autoplay; fullscreen; picture-in-picture',
        style: 'width:100%;aspect-ratio:16/9;border-radius:8px;border:0;',
      }],
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement('div')
      wrapper.setAttribute('data-iframe-embed', '')
      wrapper.style.cssText = 'position:relative;width:100%;margin:1rem 0;'

      const iframe = document.createElement('iframe')
      iframe.src           = node.attrs.src
      iframe.title         = node.attrs.title ?? 'Video'
      iframe.style.cssText = 'width:100%;aspect-ratio:16/9;border-radius:8px;border:0;'
      iframe.setAttribute('allowfullscreen', 'true')
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture')

      wrapper.appendChild(iframe)
      return { dom: wrapper }
    }
  },

  addCommands() {
    return {
      setIframe: (attrs: { src: string; title?: string }) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs })
      },
    } as any
  },
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function toEmbedUrl(raw: string): { type: 'youtube' | 'iframe'; url: string; title: string } {
  const url = raw.trim()

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { type: 'youtube', url, title: 'YouTube Video' }
  }
  // Vimeo
  if (url.includes('vimeo.com')) {
    return { type: 'youtube', url, title: 'Vimeo Video' }
  }
  // Loom — convert share URL to embed URL
  if (url.includes('loom.com')) {
    const embedUrl = url.replace('loom.com/share/', 'loom.com/embed/')
                        .replace(/\?.*$/, '')   // strip query params
    return { type: 'iframe', url: embedUrl, title: 'Loom Recording' }
  }
  // Scribe — auto-generated step-by-step process guides
  if (url.includes('scribehow.com')) {
    const embedUrl = url.includes('/embed/') ? url : url.replace('/shared/', '/embed/')
    return { type: 'iframe', url: embedUrl, title: 'Scribe Guide' }
  }
  // Tango — free Scribe alternative, auto-captures process steps
  if (url.includes('app.tango.us')) {
    const embedUrl = url.includes('/embed/') ? url : url.replace('/app/workflow/', '/app/embed/')
    return { type: 'iframe', url: embedUrl, title: 'Tango Guide' }
  }
  // Google Drive video
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([^/]+)/)
    const embedUrl = match
      ? `https://drive.google.com/file/d/${match[1]}/preview`
      : url
    return { type: 'iframe', url: embedUrl, title: 'Google Drive Video' }
  }
  // Generic iframe fallback
  return { type: 'iframe', url, title: 'Video' }
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick, active, disabled, title, children
}: {
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-7 h-7 rounded flex items-center justify-center text-sm transition-colors',
        active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

// ── Small inline popover ───────────────────────────────────────────────────────

function Popover({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-80">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded hover:bg-slate-100 text-slate-400"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  content?: object | null
  onChange?: (content: object) => void
  placeholder?: string
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Popover state
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [imageUrl,      setImageUrl]      = useState('')
  const [showVideoMenu, setShowVideoMenu] = useState(false)
  const [videoInput,    setVideoInput]    = useState('')
  const [showLinkMenu,  setShowLinkMenu]  = useState(false)
  const [linkInput,     setLinkInput]     = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your content here...' }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      IframeEmbed,
    ],
    content: content || undefined,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-slate max-w-none focus:outline-none min-h-[200px] text-sm',
      },
    },
  })

  // ── Image helpers ────────────────────────────────────────────────────────────

  function insertImageUrl() {
    if (imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl.trim() }).run()
      setImageUrl('')
      setShowImageMenu(false)
    }
  }

  function insertImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      editor?.chain().focus().setImage({ src }).run()
      setShowImageMenu(false)
    }
    reader.readAsDataURL(file)
  }

  // ── Video helper ─────────────────────────────────────────────────────────────

  function insertVideo() {
    const raw = videoInput.trim()
    if (!raw) return
    const { type, url, title } = toEmbedUrl(raw)
    if (type === 'youtube') {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run()
    } else {
      ;(editor?.chain().focus() as any).setIframe({ src: url, title }).run()
    }
    setVideoInput('')
    setShowVideoMenu(false)
  }

  // ── Link helper ──────────────────────────────────────────────────────────────

  function insertLink() {
    if (linkInput.trim()) {
      editor?.chain().focus().setLink({ href: linkInput.trim() }).run()
      setLinkInput('')
      setShowLinkMenu(false)
    }
  }

  if (readOnly) {
    return (
      <div className="prose prose-slate max-w-none text-sm">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) insertImageFile(file)
          e.target.value = ''
        }}
      />

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">

        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} title="Undo" disabled={!editor?.can().undo()}>
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} title="Redo" disabled={!editor?.can().redo()}>
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline Code">
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* ── Link button ── */}
        <div className="relative">
          <ToolbarButton
            onClick={() => { setShowLinkMenu(v => !v); setShowImageMenu(false); setShowVideoMenu(false) }}
            active={editor?.isActive('link') || showLinkMenu}
            title="Add Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarButton>
          {showLinkMenu && (
            <Popover onClose={() => setShowLinkMenu(false)}>
              <p className="text-xs font-semibold text-slate-700 mb-2">Insert Link</p>
              <input
                autoFocus
                type="url"
                placeholder="https://example.com"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertLink()}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
              />
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkInput.trim()}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg py-1.5 font-semibold transition-colors"
              >
                Insert link
              </button>
            </Popover>
          )}
        </div>

        {/* ── Image button ── */}
        <div className="relative">
          <ToolbarButton
            onClick={() => { setShowImageMenu(v => !v); setShowLinkMenu(false); setShowVideoMenu(false) }}
            active={showImageMenu}
            title="Insert Image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          {showImageMenu && (
            <Popover onClose={() => setShowImageMenu(false)}>
              <p className="text-xs font-semibold text-slate-700 mb-2">Insert Image</p>

              {/* Upload from device */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-3 py-2 font-semibold transition-colors mb-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload from device
              </button>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">or paste URL</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertImageUrl()}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
              />
              <button
                type="button"
                onClick={insertImageUrl}
                disabled={!imageUrl.trim()}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg py-1.5 font-semibold transition-colors"
              >
                Insert from URL
              </button>
            </Popover>
          )}
        </div>

        {/* ── Video button ── */}
        <div className="relative">
          <ToolbarButton
            onClick={() => { setShowVideoMenu(v => !v); setShowLinkMenu(false); setShowImageMenu(false) }}
            active={showVideoMenu}
            title="Embed Video or Guide (YouTube, Vimeo, Loom, Scribe…)"
          >
            <Video className="w-3.5 h-3.5" />
          </ToolbarButton>
          {showVideoMenu && (
            <Popover onClose={() => setShowVideoMenu(false)}>
              <p className="text-xs font-semibold text-slate-700 mb-1">Embed Video</p>
              <p className="text-[10px] text-slate-400 mb-2">YouTube · Vimeo · Loom · Tango · Scribe · Google Drive</p>
              <input
                autoFocus
                type="url"
                placeholder="Paste video URL…"
                value={videoInput}
                onChange={e => setVideoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertVideo()}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
              />
              <button
                type="button"
                onClick={insertVideo}
                disabled={!videoInput.trim()}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg py-1.5 font-semibold transition-colors"
              >
                Embed video
              </button>
            </Popover>
          )}
        </div>

      </div>

      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
