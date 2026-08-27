import { JapaneseCertificate } from "@/types/certificate"
import type { Certificates_StoreType } from "../types"

type StoreSet = (fn: (state: Certificates_StoreType) => Partial<Certificates_StoreType>) => void
type StoreGet = () => Certificates_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper function to transform file path to URL
const getImageUrl = (filePath: string): string => {
  if (!filePath) return '/placeholder-certificate.png';

  if (filePath.startsWith('/')) {
    return filePath;
  }

  if (filePath.startsWith('uploads/')) {
    return `/${filePath}`;
  }

  const filename = filePath.split(/[\\\/]/).pop() || '';
  if (!filename) return '/placeholder-certificate.png';

  return `/uploads/certificates/${filename}`;
};

// Helper to transform certificate data from API (receiving from backend)
const transformCertificate = (cert: any): JapaneseCertificate => {
  // Handle various possible status formats from backend
  let status = cert.verificationStatus?.toLowerCase() || 'pending';

  // Handle both 'verified' and 'approved' statuses
  if (status === 'verified') {
    status = 'approved';
  }

  // Ensure status is one of the valid values
  if (!['approved', 'pending', 'rejected'].includes(status)) {
    status = 'pending';
  }

  return {
    id: String(cert.id || ''),
    certificateType: cert.certificateType,
    japaneseLevel: cert.japaneseLevel,
    filePath: getImageUrl(cert.filePath || ''),
    verificationStatus: status as 'approved' | 'pending' | 'rejected',
    verifiedAt: cert.verifiedAt ? new Date(cert.verifiedAt) : null,
    employeeId: cert.employeeId || '',
    employeeName: cert.employeeName || '',
    email: cert.email || '',
    profilePhotoPath: cert.profilePhotoPath || cert.profile_photo_path || null,
    divisionName: cert.divisionName || '',
    departmentName: cert.departmentName || '',
    teamName: cert.teamName || '',
    verifiedByEmployeeId: cert.verifiedByEmployeeId || cert.verified_by_employee_id || null,
    verifiedByEmployeeName: cert.verifiedByEmployeeName || cert.verified_by_employee_name || null,
    verifiedByProfilePhotoPath:
      cert.verifiedByProfilePhotoPath ||
      cert.verified_by_profile_photo_path ||
      cert.verifiedByAvatar ||
      null,
    createdAt: cert.createdAt ? new Date(cert.createdAt) : null,
    remark: cert.remark || null,
  };
};

// Helper to map status to uppercase for backend (when sending)
const mapStatusToBackend = (status: string): string => {
  return status.toUpperCase(); // 'pending' -> 'PENDING', 'approved' -> 'APPROVED', etc.
};

// Helper to get userId from the combined store
const getUserIdFromStore = (get: StoreGet) => {
  try {
    // Cast to any to access session from the combined store
    const state = get() as any;
    return state.session?.userId || null;
  } catch {
    return null;
  }
};

// Helper to get auth headers
const getAuthHeaders = (token: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to get multipart auth headers
const getMultipartAuthHeaders = (token: string | null): HeadersInit => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const certificateDataStore = (set: StoreSet, get: StoreGet) => ({
  certificateData: [] as JapaneseCertificate[],
  pendingCertificates: [] as JapaneseCertificate[],
  allCertificates: [] as JapaneseCertificate[],

  fetch_CertificateData: async (userId?: string) => {
    // Use provided userId or get from session
    const userIdParam = userId || getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userIdParam) {
      set(() => ({ certificateData: [] }))
      return []
    }


    try {
      const response = await fetch(`${apiUrl}/api/certificates/my?employeeId=${userIdParam}`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const certificates = result.data || [];

      const transformedData = Array.isArray(certificates)
        ? certificates.map(transformCertificate)
        : [];


      set(() => ({ certificateData: transformedData }))

      return transformedData

    } catch (error) {
      set(() => ({ certificateData: [] }))
      return []
    }
  },

  // Fetch pending certificates (for approver)
  fetch_PendingCertificates: async (approverId?: string) => {
    const userIdParam = approverId || getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userIdParam) {
      set(() => ({ pendingCertificates: [] }))
      return []
    }

    try {
      const response = await fetch(`${apiUrl}/api/certificates/pending?employeeId=${userIdParam}`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const certificates = result.data || [];

      const transformedData = Array.isArray(certificates)
        ? certificates.map(transformCertificate)
        : [];

      set(() => ({ pendingCertificates: transformedData }))
      return transformedData

    } catch (error) {
      set(() => ({ pendingCertificates: [] }))
      return []
    }
  },

  // Fetch all certificates (for approver)
  fetch_AllCertificates: async (approverId?: string) => {
    const userIdParam = approverId || getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userIdParam) {
      set(() => ({ allCertificates: [] }))
      return []
    }

    try {
      const response = await fetch(`${apiUrl}/api/certificates/all?employeeId=${userIdParam}`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const certificates = result.data || [];

      const transformedData = Array.isArray(certificates)
        ? certificates.map(transformCertificate)
        : [];

      set(() => ({ allCertificates: transformedData }))
      return transformedData

    } catch (error) {
      set(() => ({ allCertificates: [] }))
      return []
    }
  },

  // Add certificate
  add_CertificateData: async (newCertificate: Partial<JapaneseCertificate> & { file?: File }) => {
    const userId = getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userId) {
      return 'User not authenticated'
    }

    const previousData = get().certificateData;

    if (!newCertificate.certificateType) {
      return 'Certificate type is required'
    }

    if (!newCertificate.japaneseLevel) {
      return 'Certificate level is required'
    }

    // Create optimistic certificate
    const optimisticCertificate: JapaneseCertificate = {
      id: `temp-${Date.now()}`,
      certificateType: newCertificate.certificateType,
      japaneseLevel: newCertificate.japaneseLevel,
      filePath: newCertificate.file ? URL.createObjectURL(newCertificate.file) : '/placeholder-certificate.png',
      verificationStatus: 'pending',
      verifiedAt: null,
      employeeId: userId,
    };

    set(() => ({
      certificateData: [optimisticCertificate, ...previousData],
    }));

    try {
      const formData = new FormData();
      formData.append('employeeId', userId);
      formData.append('certificateType', newCertificate.certificateType || '');
      formData.append('japaneseLevel', newCertificate.japaneseLevel || '');

      if (newCertificate.file) {
        formData.append('file', newCertificate.file);
      } else {
        throw new Error('No file selected');
      }

      const response = await fetch(`${apiUrl}/api/certificates/upload`, {
        method: 'POST',
        headers: getMultipartAuthHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate added successfully';

    } catch (error) {
      set(() => ({ certificateData: previousData }));
      return `Failed to add certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update certificate
  update_CertificateData: async (id: string, updatedCertificate: Partial<JapaneseCertificate> & { file?: File }) => {
    const userId = getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userId) {
      return 'User not authenticated'
    }

    const previousData = get().certificateData;
    const existingCertificate = previousData.find(cert => cert.id === id);

    if (!existingCertificate) {
      return `Certificate with ID "${id}" not found.`;
    }

    const updatedData = previousData.map((cert) =>
      cert.id === id ? {
        ...cert,
        certificateType: updatedCertificate.certificateType || cert.certificateType,
        japaneseLevel: updatedCertificate.japaneseLevel || cert.japaneseLevel,
        filePath: updatedCertificate.file ? URL.createObjectURL(updatedCertificate.file) : cert.filePath,
      } : cert
    );

    set(() => ({ certificateData: updatedData }));

    try {
      const formData = new FormData();
      formData.append('employeeId', userId);
      formData.append('certificateType', updatedCertificate.certificateType || existingCertificate.certificateType);
      formData.append('japaneseLevel', updatedCertificate.japaneseLevel || existingCertificate.japaneseLevel);

      if (updatedCertificate.file) {
        formData.append('file', updatedCertificate.file);
      }

      const response = await fetch(`${apiUrl}/api/certificates/${id}`, {
        method: 'PUT',
        headers: getMultipartAuthHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate updated successfully.';

    } catch (error) {
      set(() => ({ certificateData: previousData }));
      return `Failed to update certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete certificate
  delete_CertificateData: async (id: string) => {
    const userId = getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userId) {
      return 'User not authenticated'
    }

    const previousData = get().certificateData;

    set(() => ({
      certificateData: previousData.filter(cert => cert.id !== id),
    }));

    try {
      const response = await fetch(`${apiUrl}/api/certificates/${id}?employeeId=${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate deleted successfully.';

    } catch (error) {
      set(() => ({ certificateData: previousData }));
      return `Failed to delete certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Verify certificate
  verify_CertificateData: async (id: string, remark?: string) => {
    const userId = getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userId) {
      return 'User not authenticated'
    }

    try {
      const url = new URL(`${apiUrl}/api/certificates/${id}/verify`);
      url.searchParams.append('employeeId', userId);
      if (remark) {
        url.searchParams.append('remark', remark);
      }

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      // Refresh both my certificates and all certificates
      await get().fetch_CertificateData(userId);
      await get().fetch_AllCertificates(userId);
      await get().fetch_PendingCertificates(userId);

      return 'Certificate verified successfully.';

    } catch (error) {
      return `Failed to verify certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Reject certificate
  reject_CertificateData: async (id: string, remark?: string) => {
    const userId = getUserIdFromStore(get);
    const token = get().getToken?.() || null;

    if (!userId) {
      return 'User not authenticated'
    }

    try {
      const url = new URL(`${apiUrl}/api/certificates/${id}/reject`);
      url.searchParams.append('employeeId', userId);
      if (remark) {
        url.searchParams.append('remark', remark);
      }

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      // Refresh both my certificates and all certificates
      await get().fetch_CertificateData(userId);
      await get().fetch_AllCertificates(userId);
      await get().fetch_PendingCertificates(userId);

      return 'Certificate rejected successfully.';

    } catch (error) {
      return `Failed to reject certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },



});
