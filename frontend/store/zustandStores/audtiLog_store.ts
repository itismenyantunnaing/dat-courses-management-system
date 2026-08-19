import { AuditLog_StoreType } from "../types"

type StoreSet = (
    fn: (state: AuditLog_StoreType) => Partial<AuditLog_StoreType>
) => void
type StoreGet = () => AuditLog_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// In auditLogStore.ts

export const auditLogStore = (set: StoreSet, get: StoreGet) => ({
    auditLogs: [],
    allAuditLogs: [],
    isCreating: false,
    isLoading: false,
    pagination: {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        pageSize: 20,
    },
    _filters: {
        employeeId: undefined as string | undefined,
        module: undefined as string | undefined,
        action: undefined as string | undefined,
        from: undefined as string | undefined,
        to: undefined as string | undefined,
    },

    // Fetch ALL audit logs with filters (no pagination from backend)
    fetch_AuditLogs: async (
        employeeId?: string,
        module?: string,
        action?: string,
        from?: string,
        to?: string,
        page: number = 0,
        size: number = 20
    ) => {
        try {
            set(() => ({ isLoading: true }));

            // Build query parameters
            const params = new URLSearchParams();
            if (employeeId) params.append('employeeId', employeeId);
            if (module) params.append('module', module);
            if (action) params.append('action', action);
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            
            // Request all logs with a large page size
            params.append('page', '0');
            params.append('size', '1000'); // Or whatever max your backend supports

            const response = await fetch(`${apiUrl}/api/audit-logs?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Extract all logs from the response
            const allLogs = result.content || result || [];
            
            // Store all logs
            set(() => ({
                auditLogs: allLogs,
                allAuditLogs: allLogs,
                isLoading: false,
                // Update pagination for frontend usage
                pagination: {
                    currentPage: 0,
                    totalPages: Math.ceil(allLogs.length / size),
                    totalItems: allLogs.length,
                    pageSize: size,
                }
            }));
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            set(() => ({
                auditLogs: [],
                allAuditLogs: [],
                isLoading: false,
                pagination: {
                    currentPage: 0,
                    totalPages: 0,
                    totalItems: 0,
                    pageSize: 20,
                }
            }));
        }
    },

    // Fetch with filters and store them
    fetch_AuditLogsWithFilters: async (
        employeeId?: string,
        module?: string,
        action?: string,
        from?: string,
        to?: string,
        page: number = 0,
        size: number = 20
    ) => {
        // Store filters for pagination
        set(() => ({
            _filters: { employeeId, module, action, from, to }
        }));

        await get().fetch_AuditLogs(employeeId, module, action, from, to, page, size);
    },

    // Fetch single audit log by ID
    fetch_AuditLogById: async (id: number) => {
        try {
            const response = await fetch(`${apiUrl}/api/audit-logs/${id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const auditLog = await response.json();
            return auditLog;
        } catch (error) {
            console.error('Error fetching audit log by ID:', error);
            throw error;
        }
    },

    // This method is now redundant since we fetch all logs at once
    // Keep it for compatibility but it just returns the stored data
    fetch_AllAuditLogs: async (
        employeeId?: string,
        module?: string,
        action?: string,
        from?: string,
        to?: string
    ) => {
        const { allAuditLogs, fetch_AuditLogs } = get();
        
        // If we don't have all logs yet, fetch them
        if (allAuditLogs.length === 0) {
            await fetch_AuditLogs(employeeId, module, action, from, to);
        }
        
        return get().allAuditLogs;
    },

    // Create new audit log
    add_AuditLog: async (newAuditLog: {
        employeeId: string;
        action: string;
        module: string;
        oldValue?: string;
        newValue?: string;
        description?: string;
        ipAddress?: string;
    }) => {
        const previousData = get().auditLogs;

        // Create optimistic item with temporary ID
        const optimisticLog = {
            ...newAuditLog,
            id: -Date.now(),
            employeeName: 'Loading...',
            employeeRole: 'Loading...',
            createdAt: new Date().toISOString(),
        };

        // Immediately push to UI
        set(() => ({
            auditLogs: [optimisticLog, ...previousData],
            allAuditLogs: [optimisticLog, ...get().allAuditLogs],
            isCreating: true
        }));

        try {
            const response = await fetch(`${apiUrl}/api/audit-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAuditLog),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Refresh to get the real data from the server
            await get().fetch_AuditLogs();

            set(() => ({ isCreating: false }));
            return result;

        } catch (error) {
            console.error('Error creating audit log:', error);

            // Rollback to original state if the API fails
            set(() => ({
                auditLogs: previousData,
                allAuditLogs: previousData,
                isCreating: false
            }));

            throw error;
        }
    },

    // Update audit log
    update_AuditLog: async (id: number, updatedAuditLog: {
        employeeId?: string;
        action?: string;
        module?: string;
        oldValue?: string;
        newValue?: string;
        description?: string;
        ipAddress?: string;
    }) => {
        const previousData = get().auditLogs;

        // Check if audit log exists
        const existingLog = previousData.find(log => log.id === id);
        if (!existingLog) {
            return `Audit log with ID "${id}" not found.`;
        }

        // Optimistically update the audit log in the UI
        const updatedData = previousData.map((log) =>
            log.id === id ? { ...log, ...updatedAuditLog } : log
        );

        set(() => ({
            auditLogs: updatedData,
            allAuditLogs: updatedData,
            isCreating: true
        }));

        try {
            const response = await fetch(`${apiUrl}/api/audit-logs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedAuditLog),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();

            // Refresh to get the updated data from the server
            await get().fetch_AuditLogs();

            set(() => ({ isCreating: false }));
            return result;

        } catch (error) {
            console.error('Error updating audit log:', error);

            // Rollback to original state if the API fails
            set(() => ({
                auditLogs: previousData,
                allAuditLogs: previousData,
                isCreating: false
            }));

            throw error;
        }
    },

    // Delete audit log
    delete_AuditLog: async (id: number) => {
        const previousData = get().auditLogs;

        // Optimistically remove from UI
        set(() => ({
            auditLogs: previousData.filter(log => log.id !== id),
            allAuditLogs: previousData.filter(log => log.id !== id),
        }));

        try {
            const response = await fetch(`${apiUrl}/api/audit-logs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    }
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Refresh to get the updated data from the server
            await get().fetch_AuditLogs();

            return `Audit log deleted successfully`;

        } catch (error) {
            console.error('Error deleting audit log:', error);

            // Rollback to original state if the API fails
            set(() => ({
                auditLogs: previousData,
                allAuditLogs: previousData,
            }));

            throw error;
        }
    },

    // Bulk delete audit logs
    delete_BulkAuditLogs: async (ids: number[]) => {
        const previousData = get().auditLogs;
        const count = ids.length;

        // Optimistically remove from UI
        set(() => ({
            auditLogs: previousData.filter(log => log.id !== undefined && !ids.includes(log.id)),
            allAuditLogs: previousData.filter(log => log.id !== undefined && !ids.includes(log.id)),
        }));

        try {
            const response = await fetch(`${apiUrl}/api/audit-logs`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ids),
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    }
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Refresh to get the updated data from the server
            await get().fetch_AuditLogs();

            const customMessage = count === 1
                ? `1 Audit log deleted successfully`
                : `${count} Audit logs deleted successfully`;

            return customMessage;

        } catch (error) {
            console.error('Error bulk deleting audit logs:', error);

            // Rollback to original state if the API fails
            set(() => ({
                auditLogs: previousData,
                allAuditLogs: previousData,
            }));

            throw error;
        }
    },

    // Go to next page (frontend pagination)
    nextPage: async () => {
        const { pagination } = get();
        if (pagination.currentPage < pagination.totalPages - 1) {
            set(() => ({
                pagination: {
                    ...pagination,
                    currentPage: pagination.currentPage + 1
                }
            }));
        }
    },

    // Go to previous page (frontend pagination)
    prevPage: async () => {
        const { pagination } = get();
        if (pagination.currentPage > 0) {
            set(() => ({
                pagination: {
                    ...pagination,
                    currentPage: pagination.currentPage - 1
                }
            }));
        }
    },

    // Go to specific page (frontend pagination)
    goToPage: async (page: number) => {
        const { pagination } = get();
        if (page >= 0 && page < pagination.totalPages) {
            set(() => ({
                pagination: {
                    ...pagination,
                    currentPage: page
                }
            }));
        }
    },

    // Change page size (frontend pagination)
    setPageSize: async (size: number) => {
        const { auditLogs } = get();
        set(() => ({
            pagination: {
                currentPage: 0,
                totalPages: Math.ceil(auditLogs.length / size),
                totalItems: auditLogs.length,
                pageSize: size,
            }
        }));
    },

    // Clear filters
    clearFilters: async () => {
        set(() => ({
            _filters: {
                employeeId: undefined,
                module: undefined,
                action: undefined,
                from: undefined,
                to: undefined,
            }
        }));
        await get().fetch_AuditLogs();
    },

    // Reset pagination to first page
    resetPagination: async () => {
        const { auditLogs, _filters } = get();
        await get().fetch_AuditLogs(
            _filters?.employeeId,
            _filters?.module,
            _filters?.action,
            _filters?.from,
            _filters?.to,
            0,
            20
        );
    },
})