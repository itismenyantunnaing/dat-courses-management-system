"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mainStore } from "@/store/mainStore"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, EditIcon, Add01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"

interface DictionaryDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

interface DictionaryFormData {
    englishText: string
    japaneseText: string
}

interface DictionaryEntry {
    id: number
    englishText: string
    japaneseText: string
}

export function DictionaryDrawer({
    open,
    onOpenChange,
    onSuccess,
}: DictionaryDrawerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [formData, setFormData] = useState<DictionaryFormData>({
        englishText: "",
        japaneseText: "",
    })
    const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [entryToDelete, setEntryToDelete] = useState<DictionaryEntry | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const { dictionary, fetch_dictionary, add_dictionary, update_dictionary, delete_dictionary } = mainStore()

    // Filter dictionary entries based on search term
    const filteredDictionary = useMemo(() => {
        if (!searchTerm.trim()) return dictionary || []
        
        const term = searchTerm.toLowerCase().trim()
        return (dictionary || []).filter((entry: DictionaryEntry) => {
            // Search in English text
            if (entry.englishText.toLowerCase().includes(term)) return true
            // Search in Japanese text
            if (entry.japaneseText.toLowerCase().includes(term)) return true
            return false
        })
    }, [dictionary, searchTerm])

    // Load dictionary data when drawer opens
    useEffect(() => {
        if (open) {
            loadDictionary()
            // Reset search term when drawer opens
            setSearchTerm("")
        }
    }, [open])

    const loadDictionary = async () => {
        setIsLoading(true)
        try {
            await fetch_dictionary()
        } catch (error) {
            console.error("Failed to load dictionary:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Reset form when drawer opens/closes or editing entry changes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset form when closing
            setFormData({
                englishText: "",
                japaneseText: "",
            })
            setEditingEntry(null)
            setShowForm(false)
            setEntryToDelete(null)
            setDeleteDialogOpen(false)
            setSearchTerm("")
        }
        onOpenChange(newOpen)
    }

    const handleAddNew = () => {
        setEditingEntry(null)
        setFormData({
            englishText: "",
            japaneseText: "",
        })
        setShowForm(true)
    }

    const handleEdit = (entry: DictionaryEntry) => {
        setEditingEntry(entry)
        setFormData({
            englishText: entry.englishText,
            japaneseText: entry.japaneseText,
        })
        setShowForm(true)
    }

    const handleCancelForm = () => {
        setEditingEntry(null)
        setFormData({
            englishText: "",
            japaneseText: "",
        })
        setShowForm(false)
    }

    const handleDeleteClick = (entry: DictionaryEntry) => {
        setEntryToDelete(entry)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!entryToDelete) return

        setIsDeleting(true)
        try {
            await delete_dictionary(entryToDelete.id)
            await loadDictionary()
            setDeleteDialogOpen(false)
            setEntryToDelete(null)

            // If we were editing the deleted entry, clear the form
            if (editingEntry?.id === entryToDelete.id) {
                handleCancelForm()
            }

            onSuccess?.()
        } catch (error) {
            console.error("Failed to delete dictionary entry:", error)
            alert(error instanceof Error ? error.message : "Failed to delete entry")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.englishText || !formData.japaneseText) return

        setIsSubmitting(true)

        try {
            if (editingEntry) {
                // Update existing entry
                await update_dictionary(editingEntry.id, {
                    englishText: formData.englishText.trim(),
                    japaneseText: formData.japaneseText.trim(),
                })
            } else {
                // Create new entry
                await add_dictionary({
                    englishText: formData.englishText.trim(),
                    japaneseText: formData.japaneseText.trim(),
                })
            }

            // Refresh the dictionary list
            await loadDictionary()

            // Reset form and hide it
            setFormData({
                englishText: "",
                japaneseText: "",
            })
            setEditingEntry(null)
            setShowForm(false)

            // Trigger success callback
            onSuccess?.()
        } catch (error) {
            console.error(`Failed to ${editingEntry ? 'update' : 'create'} dictionary entry:`, error)
            alert(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid = formData.englishText.trim() && formData.japaneseText.trim()

    return (
        <>
            <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
                <DrawerContent className="right-0 left-auto h-full w-[75%] sm:w-[60%] md:w-[50%] lg:w-[40%] xl:w-[30%]">
                    <DrawerHeader className="shrink-0 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <DrawerTitle>Dictionary Management</DrawerTitle>
                                <p className="text-sm text-muted-foreground">
                                    Manage translations for the skillset table
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleAddNew}
                                variant={showForm ? "secondary" : "default"}
                            >
                                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-1 h-4 w-4" />
                                Add New
                            </Button>
                        </div>
                    </DrawerHeader>

                    {/* Search Bar */}
                    <div className="px-6 py-3 border-b">
                        <div className="relative">
                            <HugeiconsIcon
                                icon={Search01Icon}
                                strokeWidth={2}
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                placeholder="Search translations in English or Japanese..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {searchTerm && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Found {filteredDictionary.length} matching translation(s)
                            </p>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="px-6 py-4">
                            {/* Edit/Create Form - Always at the top when visible */}
                            {showForm && (
                                <div className="mb-6 rounded-lg border p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">
                                            {editingEntry ? "Edit Entry" : "Add New Entry"}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancelForm}
                                        >
                                            Cancel
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* English Text */}
                                        <div className="space-y-2">
                                            <Label htmlFor="englishText">
                                                English Text <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="englishText"
                                                placeholder="Enter English text (e.g., Yes)"
                                                value={formData.englishText}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, englishText: e.target.value })
                                                }
                                                required
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Japanese Text */}
                                        <div className="space-y-2">
                                            <Label htmlFor="japaneseText">
                                                Japanese Text <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="japaneseText"
                                                placeholder="Enter Japanese translation (e.g., はい)"
                                                value={formData.japaneseText}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, japaneseText: e.target.value })
                                                }
                                                required
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Preview Section */}
                                        {formData.englishText && formData.japaneseText && (
                                            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                                                <p className="mb-2 text-sm font-medium text-muted-foreground">
                                                    Preview:
                                                </p>
                                                <div className="flex items-center justify-between rounded-md bg-background px-4 py-2">
                                                    <span className="font-medium">{formData.englishText}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="font-medium">{formData.japaneseText}</span>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            className="w-full"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !isFormValid}
                                        >
                                            {isSubmitting
                                                ? (editingEntry ? "Updating..." : "Adding...")
                                                : (editingEntry ? "Update Entry" : "Add Entry")}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Dictionary List */}
                            <div>
                                <h3 className="mb-4 text-lg font-semibold">
                                    All Translations ({filteredDictionary.length})
                                </h3>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                    </div>
                                ) : filteredDictionary.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center">
                                        <p className="text-muted-foreground">
                                            {searchTerm ? "No matching translations found" : "No translations found"}
                                        </p>
                                        {searchTerm ? (
                                            <p className="text-sm text-muted-foreground">
                                                Try searching with different keywords
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Click "Add New" to create your first translation
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredDictionary.map((entry: DictionaryEntry) => (
                                            <div
                                                key={entry.id}
                                                className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${editingEntry?.id === entry.id ? "bg-muted/30 border-primary" : ""
                                                    }`}
                                            >
                                                <div className="flex flex-1 items-center gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{entry.englishText}</span>
                                                            <span className="text-muted-foreground">→</span>
                                                            <span>{entry.japaneseText}</span>
                                                        </div>
                                                    </div>
                                                    {editingEntry?.id === entry.id && (
                                                        <Badge variant="outline" className="shrink-0">
                                                            Editing
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleEdit(entry)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <HugeiconsIcon icon={EditIcon} strokeWidth={2} className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteClick(entry)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className="shrink-0 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">
                                Close
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Dictionary Entry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the translation for{" "}
                            <span className="font-semibold">"{entryToDelete?.englishText}"</span>?
                            <br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}