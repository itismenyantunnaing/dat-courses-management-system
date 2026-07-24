import { AuditLog_StoreType } from "../types"

type StoreSet = (
    fn: (state: AuditLog_StoreType) => Partial<AuditLog_StoreType>
) => void
type StoreGet = () => AuditLog_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

    // Fetch all audit logs with pagination and filters
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
            params.append('page', page.toString());
            params.append('size', size.toString());

            const response = await fetch(`${apiUrl}/api/audit-logs?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle both paginated and non-paginated responses
            const auditLogs = result.content || result || [];
            const pagination = result.pageable ? {
                currentPage: result.number || 0,
                totalPages: result.totalPages || 0,
                totalItems: result.totalElements || 0,
                pageSize: result.size || 20,
            } : {
                currentPage: 0,
                totalPages: 1,
                totalItems: auditLogs.length,
                pageSize: size,
            };

            set(() => ({
                auditLogs: auditLogs,
                pagination: pagination,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            set(() => ({
                auditLogs: [],
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

    // Fetch all audit logs without pagination (for export)
    fetch_AllAuditLogs: async (
        employeeId?: string,
        module?: string,
        action?: string,
        from?: string,
        to?: string
    ) => {
        try {
            set(() => ({ isLoading: true }));

            let allLogs: any[] = [];
            let currentPage = 0;
            let totalPages = 1;
            const pageSize = 100; // Max allowed by backend

            do {
                const params = new URLSearchParams();
                if (employeeId) params.append('employeeId', employeeId);
                if (module) params.append('module', module);
                if (action) params.append('action', action);
                if (from) params.append('from', from);
                if (to) params.append('to', to);
                params.append('page', currentPage.toString());
                params.append('size', pageSize.toString());

                const response = await fetch(`${apiUrl}/api/audit-logs?${params.toString()}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const logs = result.content || [];
                allLogs = [...allLogs, ...logs];

                totalPages = result.totalPages || 0;
                currentPage++;
            } while (currentPage < totalPages);

            set(() => ({
                allAuditLogs: allLogs,
                isLoading: false
            }));

            return allLogs;

        } catch (error) {
            console.error('Error fetching all audit logs:', error);
            set(() => ({
                allAuditLogs: [],
                isLoading: false
            }));
            return [];
        }
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
        }));

        try {
            const response = await fetch(`${apiUrl}/api/audit-logs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                // Try to get error message from response if available
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    }
                } catch (e) {
                    // If response body is empty or not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Only try to parse JSON if there's content
            let result = null;
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 0) {
                try {
                    result = await response.json();
                } catch (e) {
                    // If response is empty or invalid JSON, that's fine for DELETE
                    console.log('DELETE response has no body (expected for 204 No Content)');
                }
            }

            // Refresh to get the updated data from the server
            await get().fetch_AuditLogs();

            return `Audit log deleted successfully`;

        } catch (error) {
            console.error('Error deleting audit log:', error);

            // Rollback to original state if the API fails
            set(() => ({
                auditLogs: previousData
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

            // Only try to parse JSON if there's content
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 0) {
                try {
                    await response.json();
                } catch (e) {
                    console.log('DELETE response has no body (expected for 204 No Content)');
                }
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
                auditLogs: previousData
            }));

            throw error;
        }
    },

    // Go to next page
    nextPage: async () => {
        const { pagination } = get();
        if (pagination.currentPage < pagination.totalPages - 1) {
            const { _filters } = get();
            await get().fetch_AuditLogs(
                _filters?.employeeId,
                _filters?.module,
                _filters?.action,
                _filters?.from,
                _filters?.to,
                pagination.currentPage + 1,
                pagination.pageSize
            );
        }
    },

    // Go to previous page
    prevPage: async () => {
        const { pagination } = get();
        if (pagination.currentPage > 0) {
            const { _filters } = get();
            await get().fetch_AuditLogs(
                _filters?.employeeId,
                _filters?.module,
                _filters?.action,
                _filters?.from,
                _filters?.to,
                pagination.currentPage - 1,
                pagination.pageSize
            );
        }
    },

    // Go to specific page
    goToPage: async (page: number) => {
        const { pagination } = get();
        if (page >= 0 && page < pagination.totalPages) {
            const { _filters } = get();
            await get().fetch_AuditLogs(
                _filters?.employeeId,
                _filters?.module,
                _filters?.action,
                _filters?.from,
                _filters?.to,
                page,
                pagination.pageSize
            );
        }
    },

    // Change page size
    setPageSize: async (size: number) => {
        const { _filters } = get();
        await get().fetch_AuditLogs(
            _filters?.employeeId,
            _filters?.module,
            _filters?.action,
            _filters?.from,
            _filters?.to,
            0, // Reset to first page
            size
        );
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
        const { _filters } = get();
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