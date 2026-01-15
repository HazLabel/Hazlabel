"use client"

import React, { useState, useCallback, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { 
    Upload, 
    FileText, 
    X, 
    Loader2, 
    CheckCircle2,
    AlertCircle,
    Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QueuedFile {
    file: File
    id: string
    status: "pending" | "uploading" | "success" | "error"
    error?: string
}

export function UploadModal() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<QueuedFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const queryClient = useQueryClient()
    const { user } = useUser()

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const pdfFiles = Array.from(newFiles).filter(file => 
            file.type === "application/pdf" || file.name.endsWith('.pdf')
        )
        
        if (pdfFiles.length !== newFiles.length) {
            toast.error("Invalid file type", {
                description: "Only PDF files are accepted."
            })
        }

        const queued: QueuedFile[] = pdfFiles.map(file => ({
            file,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            status: "pending"
        }))

        setFiles(prev => [...prev, ...queued])
    }, [])

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files)
        }
    }, [addFiles])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files)
        }
        // Reset input so same file can be selected again
        e.target.value = ""
    }

    const uploadFiles = async () => {
        if (!user?.id || files.length === 0) return

        setIsUploading(true)

        for (const queuedFile of files) {
            if (queuedFile.status !== "pending") continue

            setFiles(prev => prev.map(f => 
                f.id === queuedFile.id ? { ...f, status: "uploading" } : f
            ))

            try {
                const formData = new FormData()
                formData.append("file", queuedFile.file)

                await api.post("/parse-sds?save_to_vault=true", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })

                setFiles(prev => prev.map(f => 
                    f.id === queuedFile.id ? { ...f, status: "success" } : f
                ))

                toast.success("SDS Processed Successfully", {
                    description: `${queuedFile.file.name} has been added to your vault.`
                })
            } catch (error) {
                const message = error instanceof Error ? error.message : "Upload failed"
                setFiles(prev => prev.map(f => 
                    f.id === queuedFile.id ? { ...f, status: "error", error: message } : f
                ))

                toast.error("Upload Failed", {
                    description: `Could not process ${queuedFile.file.name}`
                })
            }
        }

        setIsUploading(false)
        queryClient.invalidateQueries({ queryKey: ["chemicals"] })

        // Close modal after a brief delay if all successful
        const allSuccess = files.every(f => f.status === "success" || f.status === "pending")
        if (allSuccess) {
            setTimeout(() => {
                setOpen(false)
                setFiles([])
            }, 1500)
        }
    }

    const pendingCount = files.filter(f => f.status === "pending").length

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-500/20">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline">Upload SDS</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-slate-900 text-xl">Upload Safety Data Sheets</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Drop your SDS PDF files below. We&apos;ll extract GHS data automatically.
                    </DialogDescription>
                </DialogHeader>

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                        isDragging 
                            ? "border-sky-500 bg-sky-50" 
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    
                    <div className={cn(
                        "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-colors",
                        isDragging ? "bg-sky-100" : "bg-slate-100"
                    )}>
                        <Upload className={cn(
                            "h-7 w-7 transition-colors",
                            isDragging ? "text-sky-600" : "text-slate-400"
                        )} />
                    </div>
                    
                    <p className="text-slate-900 font-medium mb-1">
                        {isDragging ? "Drop files here" : "Drag & drop files here"}
                    </p>
                    <p className="text-sm text-slate-500">
                        or <span className="text-sky-600">browse</span> to select files
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        PDF files only • Max 50MB per file
                    </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {files.map((queuedFile) => (
                            <div
                                key={queuedFile.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                    queuedFile.status === "success" && "bg-emerald-50 border-emerald-200",
                                    queuedFile.status === "error" && "bg-red-50 border-red-200",
                                    queuedFile.status === "uploading" && "bg-sky-50 border-sky-200",
                                    queuedFile.status === "pending" && "bg-slate-50 border-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    queuedFile.status === "success" && "bg-emerald-100",
                                    queuedFile.status === "error" && "bg-red-100",
                                    queuedFile.status === "uploading" && "bg-sky-100",
                                    queuedFile.status === "pending" && "bg-white"
                                )}>
                                    <FileText className={cn(
                                        "h-4 w-4",
                                        queuedFile.status === "success" && "text-emerald-600",
                                        queuedFile.status === "error" && "text-red-600",
                                        queuedFile.status === "uploading" && "text-sky-600",
                                        queuedFile.status === "pending" && "text-slate-400"
                                    )} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {queuedFile.file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(queuedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                
                                <div className="shrink-0">
                                    {queuedFile.status === "uploading" && (
                                        <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
                                    )}
                                    {queuedFile.status === "success" && (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    )}
                                    {queuedFile.status === "error" && (
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    {queuedFile.status === "pending" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(queuedFile.id)
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setOpen(false)
                            setFiles([])
                        }}
                        disabled={isUploading}
                        className="border-slate-200 hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={uploadFiles}
                        disabled={pendingCount === 0 || isUploading || !user}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
