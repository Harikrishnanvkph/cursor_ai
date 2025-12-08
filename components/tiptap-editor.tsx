"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import { Extension } from '@tiptap/core'
import { useEffect, useCallback, useRef, useState } from 'react'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    RemoveFormatting,
    Highlighter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Custom extension for font size (works on inline spans)
const FontSizeExtension = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                renderHTML: attributes => {
                    if (!attributes.fontSize) return {}
                    return { style: `font-size: ${attributes.fontSize}` }
                }
            }
        }
    }
})

// Line height extension - applies to block elements (paragraph, heading)
// Line-height CSS property must be on block elements, not inline spans
const LineHeightExtension = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: null
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultLineHeight,
                        parseHTML: element => element.style.lineHeight || null,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) {
                                return {}
                            }
                            return { style: `line-height: ${attributes.lineHeight}` }
                        }
                    }
                }
            }
        ]
    },

    addCommands() {
        return {
            setLineHeight: (lineHeight: string) => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.updateAttributes(type, { lineHeight })
                )
            },
            unsetLineHeight: () => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.resetAttributes(type, 'lineHeight')
                )
            }
        }
    }
})

interface TiptapEditorProps {
    initialHtml: string
    onChange: (html: string) => void
    className?: string
    contentStyle?: {
        fontSize?: number
        fontFamily?: string
        fontWeight?: string | number
        color?: string
        textAlign?: string
        lineHeight?: number | string
        letterSpacing?: number
    }
}

// Toolbar Button Component
const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children
}: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
}) => (
    <Button
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title={title}
    >
        {children}
    </Button>
)

export function TiptapEditor({ initialHtml, onChange, className = '', contentStyle }: TiptapEditorProps) {
    // Build dynamic style string for editor content
    const editorStyleParts: string[] = []
    if (contentStyle?.fontSize) editorStyleParts.push(`font-size: ${contentStyle.fontSize}px`)
    if (contentStyle?.fontFamily) editorStyleParts.push(`font-family: ${contentStyle.fontFamily}`)
    if (contentStyle?.color) editorStyleParts.push(`color: ${contentStyle.color}`)
    if (contentStyle?.lineHeight) editorStyleParts.push(`line-height: ${contentStyle.lineHeight}`)
    if (contentStyle?.letterSpacing) editorStyleParts.push(`letter-spacing: ${contentStyle.letterSpacing}px`)
    const editorStyleString = editorStyleParts.join('; ')

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer'
                }
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto',
                    style: 'display: inline; vertical-align: middle;'
                }
            }),
            TextStyle,
            FontSizeExtension,
            FontFamily,
            LineHeightExtension,
            Color,
            Highlight.configure({
                multicolor: true
            })
        ],
        content: initialHtml,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'tiptap max-w-none focus:outline-none min-h-[350px] p-2',
                style: editorStyleString
            }
        }
    })

    // Update content when initialHtml changes
    useEffect(() => {
        if (editor && initialHtml !== editor.getHTML()) {
            editor.commands.setContent(initialHtml)
        }
    }, [initialHtml, editor])

    const setLink = useCallback(() => {
        if (!editor) return

        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageUrl, setImageUrl] = useState('')

    const addImageFromUrl = useCallback(() => {
        if (!editor || !imageUrl) return
        // Use insertContent to avoid extra paragraph/newline
        editor.chain().focus().insertContent({
            type: 'image',
            attrs: { src: imageUrl }
        }).run()
        setImageUrl('')
    }, [editor, imageUrl])

    const addImageFromFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            // Use insertContent to avoid extra paragraph/newline
            editor.chain().focus().insertContent({
                type: 'image',
                attrs: { src: base64 }
            }).run()
        }
        reader.readAsDataURL(file)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [editor])

    // Get current line height from the active node
    const getCurrentLineHeight = () => {
        if (!editor) return ''
        const { lineHeight } = editor.getAttributes('paragraph')
        return lineHeight || ''
    }

    if (!editor) {
        return null
    }

    return (
        <div className={`border rounded-lg overflow-hidden bg-white flex flex-col ${className}`}>
            {/* Toolbar */}
            <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center shrink-0">
                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Font Family */}
                <Select
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    onValueChange={(value) => {
                        if (value === 'default') {
                            editor.chain().focus().unsetFontFamily().run()
                        } else {
                            editor.chain().focus().setFontFamily(value).run()
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                    </SelectContent>
                </Select>

                {/* Font Size */}
                <Select
                    value={editor.getAttributes('textStyle').fontSize || ''}
                    onValueChange={(value) => {
                        if (value === 'default') {
                            editor.chain().focus().unsetMark('textStyle').run()
                        } else {
                            editor.chain().focus().setMark('textStyle', { fontSize: value }).run()
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="10px">10px</SelectItem>
                        <SelectItem value="12px">12px</SelectItem>
                        <SelectItem value="14px">14px</SelectItem>
                        <SelectItem value="16px">16px</SelectItem>
                        <SelectItem value="18px">18px</SelectItem>
                        <SelectItem value="20px">20px</SelectItem>
                        <SelectItem value="24px">24px</SelectItem>
                        <SelectItem value="28px">28px</SelectItem>
                        <SelectItem value="32px">32px</SelectItem>
                        <SelectItem value="36px">36px</SelectItem>
                        <SelectItem value="48px">48px</SelectItem>
                    </SelectContent>
                </Select>

                {/* Line Height */}
                <Select
                    value={getCurrentLineHeight()}
                    onValueChange={(value) => {
                        if (value === 'default') {
                            (editor.commands as any).unsetLineHeight()
                        } else {
                            (editor.commands as any).setLineHeight(value)
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue placeholder="Line H" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="1.2">1.2</SelectItem>
                        <SelectItem value="1.4">1.4</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="1.6">1.6</SelectItem>
                        <SelectItem value="1.8">1.8</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="2.5">2.5</SelectItem>
                    </SelectContent>
                </Select>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    isActive={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Link */}
                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    title="Add Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>

                {/* Image */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Add Image"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Add Image</Label>

                            {/* From URL */}
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">From URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={addImageFromUrl}
                                        disabled={!imageUrl}
                                        className="h-8 text-xs"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {/* From Local */}
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">From Local</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={addImageFromFile}
                                    className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Text Color */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Text Color"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold">A</span>
                                <div
                                    className="w-4 h-1 rounded"
                                    style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                                />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                        <div className="space-y-2">
                            <Label className="text-xs">Text Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                                    className="w-10 h-8 p-1"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => editor.chain().focus().unsetColor().run()}
                                    className="text-xs"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Highlight */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={editor.isActive('highlight') ? "default" : "ghost"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Highlight"
                        >
                            <Highlighter className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                        <div className="space-y-2">
                            <Label className="text-xs">Highlight Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    defaultValue="#ffff00"
                                    onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                                    className="w-10 h-8 p-1"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                                    className="text-xs"
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Clear Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    title="Clear Formatting"
                >
                    <RemoveFormatting className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="min-h-[400px]" />
            </div>
        </div>
    )
}
