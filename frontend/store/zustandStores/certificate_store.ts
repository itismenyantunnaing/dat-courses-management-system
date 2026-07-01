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

// Helper to transform certificate data from API
const transformCertificate = (cert: JapaneseCertificate): JapaneseCertificate => {
  return {
    id: String(cert.id || ''),
    certificateType: cert.certificateType,
    japaneseLevel: cert.japaneseLevel,
    filePath: getImageUrl(cert.filePath || ''),
    verificationStatus: (cert.verificationStatus?.toLowerCase() || 'pending') as 'approved' | 'pending' | 'rejected',
    verifiedAt: cert.verifiedAt ? new Date(cert.verifiedAt) : null,
    employeeId: cert.employeeId || '',
    employeeName: cert.employeeName || '',
    verifiedByEmployeeId: cert.verifiedByEmployeeId || null,
    verifiedByEmployeeName: cert.verifiedByEmployeeName || null,
  };
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

export const certificateDataStore = (set: StoreSet, get: StoreGet) => ({
  certificateData: [] as JapaneseCertificate[],

  fetch_CertificateData: async (userId?: string) => {
    // Use provided userId or get from session
    const userIdParam = userId || getUserIdFromStore(get);

    if (!userIdParam) {
      set(() => ({ certificateData: [] }))
      return []
    }

    try {
      const response = await fetch(`${apiUrl}/api/certificates/my?employeeId=${userIdParam}`);

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
      console.log('❌ Error fetching certificates:', error);
      set(() => ({ certificateData: [] }))
      return []
    }
  },

  // Add certificate
  add_CertificateData: async (newCertificate: Partial<JapaneseCertificate> & { file?: File }) => {
    const userId = getUserIdFromStore(get);

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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate added successfully';

    } catch (error) {
      console.log('❌ Error adding certificate:', error);
      set(() => ({ certificateData: previousData }));
      return `Failed to add certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update certificate
  update_CertificateData: async (id: string, updatedCertificate: Partial<JapaneseCertificate> & { file?: File }) => {
    const userId = getUserIdFromStore(get);

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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate updated successfully.';

    } catch (error) {
      console.log('❌ Error updating certificate:', error);
      set(() => ({ certificateData: previousData }));
      return `Failed to update certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete certificate
  delete_CertificateData: async (id: string) => {
    const userId = getUserIdFromStore(get);

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
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      await get().fetch_CertificateData(userId);
      return 'Certificate deleted successfully.';

    } catch (error) {
      console.log('❌ Error deleting certificate:', error);
      set(() => ({ certificateData: previousData }));
      return `Failed to delete certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },


});
