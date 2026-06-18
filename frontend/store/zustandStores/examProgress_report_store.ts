import type { 
    DeptCertificationResponse,
    TeamCertificationResponse,
    DeptWithCounts,
    TeamWithCounts
} from '@/types/exam_progress_report'
import type { ExamProgressReport_StoreType } from '../types'

const deptData = [
    { id: 1, dept_name: "Offshore Development Division" },
    { id: 2, dept_name: "Offshore Development Dept-1" },
    { id: 3, dept_name: "Offshore Development Dept-2" },
    { id: 4, dept_name: "Offshore Development Dept-3" },
    { id: 5, dept_name: "Quality Assurance Division" },
    { id: 6, dept_name: "IT Support Department" }
]

const mockDeptResponse: DeptCertificationResponse = {
    "Offshore Development Division": {
        "certified": { "N1": 0, "N2": 1, "N3": 0, "N4": 0, "N5": 0, "None": 0 }
    },
    "Offshore Development Dept-1": {
        "certified": { "N1": 1, "N2": 3, "N3": 16, "N4": 6, "N5": 5, "None": 62 }
    },
    "Offshore Development Dept-2": {
        "certified": { "N1": 1, "N2": 7, "N3": 16, "N4": 12, "N5": 8, "None": 63 }
    },
    "Offshore Development Dept-3": {
        "certified": { "N1": 2, "N2": 4, "N3": 10, "N4": 5, "N5": 3, "None": 45 }
    },
    "Quality Assurance Division": {
        "certified": { "N1": 0, "N2": 2, "N3": 5, "N4": 3, "N5": 1, "None": 20 }
    },
    "IT Support Department": {
        "certified": { "N1": 1, "N2": 0, "N3": 3, "N4": 2, "N5": 0, "None": 15 }
    }
}

const mockTeamResponse: TeamCertificationResponse = {
    "BlockChain": {
        "deptId": 1,
        "certified": { "N1": 0, "N2": 0, "N3": 0, "N4": 0, "N5": 0, "None": 6 },
        "target1": { "N1": 0, "N2": 0, "N3": 0, "N4": 5, "N5": 0, "None": 5 },
        "target2": { "N1": 0, "N2": 0, "N3": 5, "N4": 1, "N5": 0, "None": 6 },
        "currentCommunication": {
            "Level 0 | None": 5,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 3,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 2,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 1,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 2,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 1,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 0,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 0
        },
        "target1Communication": {
            "Level 0 | None": 2,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 4,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 3,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 2,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 3,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 2,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 1,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 0
        },
        "target2Communication": {
            "Level 0 | None": 1,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 3,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 4,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 3,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 4,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 3,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 1,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 1
        }
    },
    "Cst_Navi, BT18": {
        "deptId": 1,
        "certified": { "N1": 0, "N2": 0, "N3": 0, "N4": 0, "N5": 1, "None": 4 },
        "target1": { "N1": 0, "N2": 0, "N3": 2, "N4": 0, "N5": 2, "None": 5 },
        "target2": { "N1": 0, "N2": 0, "N3": 2, "N4": 2, "N5": 1, "None": 5 },
        "currentCommunication": {
            "Level 0 | None": 3,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 4,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 2,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 1,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 1,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 1,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 0,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 0
        },
        "target1Communication": {
            "Level 0 | None": 1,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 3,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 4,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 2,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 2,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 1,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 1,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 0
        },
        "target2Communication": {
            "Level 0 | None": 0,
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": 2,
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": 3,
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": 4,
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": 3,
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": 2,
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, Basic meeting participation": 1,
            "Level 3:Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": 1
        }
    }
}

type StoreSet = (fn: (state: ExamProgressReport_StoreType) => Partial<ExamProgressReport_StoreType>) => void
type StoreGet = () => ExamProgressReport_StoreType

const transformDeptData = (response: DeptCertificationResponse): DeptWithCounts[] => {
    return Object.entries(response).map(([deptName, data]) => {
        const dept = deptData.find(d => d.dept_name === deptName)
        return {
            id: dept?.id || 0,
            dept_name: deptName,
            N1: data.certified.N1 || 0,
            N2: data.certified.N2 || 0,
            N3: data.certified.N3 || 0,
            N4: data.certified.N4 || 0,
            N5: data.certified.N5 || 0,
            None: data.certified.None || 0,
        }
    })
}

const extractCommLabels = (response: TeamCertificationResponse): string[] => {
    const firstTeam = Object.values(response)[0];
    if (!firstTeam) return [];
    const commKeys = Object.keys(firstTeam.currentCommunication || {});
    const labels = commKeys.map(key => {
        const parts = key.split(':');
        return parts[0].trim();
    });
    const sortOrder: { [key: string]: number } = {
        "Level 0 | None": 0,
        "Level 1 | G1": 1,
        "Level 1 | G2": 2,
        "Level 1 | G3": 3,
        "Level 2 | G1": 4,
        "Level 2 | G2": 5,
        "Level 2 | G3": 6,
        "Level 3": 7
    };
    return labels.sort((a, b) => {
        const orderA = sortOrder[a] ?? 999;
        const orderB = sortOrder[b] ?? 999;
        return orderA - orderB;
    });
}

const transformTeamData = (response: TeamCertificationResponse): TeamWithCounts[] => {
    const commLabels = extractCommLabels(response);
    return Object.entries(response).map(([teamName, data]) => {
        const result: TeamWithCounts = {
            team_name: teamName,
            deptId: data.deptId,
            N1: data.certified.N1 || 0,
            N2: data.certified.N2 || 0,
            N3: data.certified.N3 || 0,
            N4: data.certified.N4 || 0,
            N5: data.certified.N5 || 0,
            None: data.certified.None || 0,
            target1_N1: data.target1.N1 || 0,
            target1_N2: data.target1.N2 || 0,
            target1_N3: data.target1.N3 || 0,
            target1_N4: data.target1.N4 || 0,
            target1_N5: data.target1.N5 || 0,
            target1_None: data.target1.None || 0,
            target2_N1: data.target2.N1 || 0,
            target2_N2: data.target2.N2 || 0,
            target2_N3: data.target2.N3 || 0,
            target2_N4: data.target2.N4 || 0,
            target2_N5: data.target2.N5 || 0,
            target2_None: data.target2.None || 0,
        };
        const getValueByLabel = (obj: any, label: string): number => {
            const key = Object.keys(obj).find(k => k.startsWith(label));
            return key ? obj[key] || 0 : 0;
        };
        commLabels.forEach((label, index) => {
            result[`current_comm_${index}`] = getValueByLabel(data.currentCommunication, label);
            result[`target1_comm_${index}`] = getValueByLabel(data.target1Communication, label);
            result[`target2_comm_${index}`] = getValueByLabel(data.target2Communication, label);
        });
        return result;
    });
}

export const examProgressReport_Store = (set: StoreSet, get: StoreGet) => ({
    deptData: undefined,
    teamData: undefined,
    deptDisplayData: [],
    teamDisplayData: [],

    fetch_DeptData: async () => {
        const deptData = mockDeptResponse
        const deptDisplayData = transformDeptData(deptData)
        set(() => ({ deptData: deptData, deptDisplayData: deptDisplayData }))
    },

    fetch_TeamData: async () => {
        const teamData = mockTeamResponse
        const teamDisplayData = transformTeamData(teamData)
        set(() => ({ teamData: teamData, teamDisplayData: teamDisplayData }))
    },

    fetch_TargetDates: async () => {},

    getDeptWithCounts: () => {
        return get().deptDisplayData || []
    },

    getTeamWithCounts: () => {
        return get().teamDisplayData || []
    },

    getTeamsByDept: (deptId: number) => {
        const teams = get().teamDisplayData || []
        return teams.filter(team => team.deptId === deptId)
    },
})