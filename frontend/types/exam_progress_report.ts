
export interface CommunicationLevel {
    id: string;
    label: string;
    description: string;
}

export const parseCommunicationLevel = (value: string): CommunicationLevel => {
    if (!value) {
        return { id: "Level 0 | None", label: "Level 0 | None", description: "No communication ability" }
    }
    
    const parts = value.split(':');
    if (parts.length >= 2) {
        const label = parts[0].trim();
        const description = parts.slice(1).join(':').trim();
        return {
            id: label,
            label: label,
            description: description
        };
    }
    
    return {
        id: value.trim(),
        label: value.trim(),
        description: ''
    };
}

// ============================================
// ✅ BACKEND RESPONSE TYPES
// ============================================

export interface DeptCertificationCounts {
    N1: number;
    N2: number;
    N3: number;
    N4: number;
    N5: number;
    None: number;
}

export interface DeptCertificationResponse {
    [deptName: string]: {
        certified: DeptCertificationCounts;
    };
}

export interface TeamPeriodCounts {
    N1: number;
    N2: number;
    N3: number;
    N4: number;
    N5: number;
    None: number;
}

export interface TeamCommunicationCounts {
    [key: string]: number;
}

export interface TeamCertificationResponse {
    [teamName: string]: {
        deptId: number;
        certified: TeamPeriodCounts;
        target1: TeamPeriodCounts;
        target2: TeamPeriodCounts;
        currentCommunication: TeamCommunicationCounts;
        target1Communication: TeamCommunicationCounts;
        target2Communication: TeamCommunicationCounts;
    };
}

// ============================================
// ✅ DISPLAY TYPES (for UI)
// ============================================

export interface DeptWithCounts {
    id: number;
    dept_name: string;
    N1: number;
    N2: number;
    N3: number;
    N4: number;
    N5: number;
    None: number;
}

export interface TeamWithCounts {
    team_name: string;
    deptId: number;
    N1: number;
    N2: number;
    N3: number;
    N4: number;
    N5: number;
    None: number;
    target1_N1: number;
    target1_N2: number;
    target1_N3: number;
    target1_N4: number;
    target1_N5: number;
    target1_None: number;
    target2_N1: number;
    target2_N2: number;
    target2_N3: number;
    target2_N4: number;
    target2_N5: number;
    target2_None: number;
    [key: string]: string | number | undefined;
}

