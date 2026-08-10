// store/zustandStores/examProgress_report_store.ts

import type {
    ApiResponse,
    DeptWithCounts,
    TeamWithCounts,
    CommCapabilityData,
    NoCertMemberData
} from '@/types/exam_progress_report'
import type { ExamProgressReport_StoreType } from '../types'

type StoreSet = (fn: (state: ExamProgressReport_StoreType) => Partial<ExamProgressReport_StoreType>) => void
type StoreGet = () => ExamProgressReport_StoreType

const transformDeptData = (response: ApiResponse): DeptWithCounts[] => {
    return response.byDepartment
        .filter(dept => dept.department !== "Grand Total" && dept.id !== null)
        .map(dept => ({
            id: dept.id,
            dept_name: dept.department,
            N1: dept.n1 || 0,
            N2: dept.n2 || 0,
            N3: dept.n3 || 0,
            N4: dept.n4 || 0,
            N5: dept.n5 || 0,
            None: dept.none || 0,
        }))
}

const transformTeamData = (response: ApiResponse): TeamWithCounts[] => {
    const firstTeamComm = response.byTeamComm[0]
    const commLabels: string[] = []

    if (firstTeamComm) {
        const keys = Object.keys(firstTeamComm.current)
        const sortOrder: { [key: string]: number } = {
            "Level 0 | None": 0,
            "Level 1 | G1": 1,
            "Level 1 | G2": 2,
            "Level 1 | G3": 3,
            "Level 2 | G1": 4,
            "Level 2 | G2": 5,
            "Level 2 | G3": 6,
            "Level 3": 7
        }
        commLabels.push(...keys.sort((a, b) => {
            const orderA = sortOrder[a.split(':')[0].trim()] ?? 999
            const orderB = sortOrder[b.split(':')[0].trim()] ?? 999
            return orderA - orderB
        }))
    }

    const teamMap = new Map<string, TeamWithCounts>()

    response.byTeam
        .filter(team => team.team !== "Grand Total")
        .forEach(team => {
            if (teamMap.has(team.team)) {
                console.warn(`Duplicate team found: ${team.team}, skipping duplicate`)
                return
            }

            const teamComm = response.byTeamComm.find(tc => tc.team === team.team)
            const noCert = response.noCertMembers.find(nc => nc.team === team.team)

            const result: TeamWithCounts = {
                team_name: team.team,
                deptId: team.deptId || 0,
                N1: team.current.N1 || 0,
                N2: team.current.N2 || 0,
                N3: team.current.N3 || 0,
                N4: team.current.N4 || 0,
                N5: team.current.N5 || 0,
                None: noCert?.current || 0,
                target1_N1: team.target1.N1 || 0,
                target1_N2: team.target1.N2 || 0,
                target1_N3: team.target1.N3 || 0,
                target1_N4: team.target1.N4 || 0,
                target1_N5: team.target1.N5 || 0,
                target1_None: noCert?.target1 || 0,
                target2_N1: team.target2.N1 || 0,
                target2_N2: team.target2.N2 || 0,
                target2_N3: team.target2.N3 || 0,
                target2_N4: team.target2.N4 || 0,
                target2_N5: team.target2.N5 || 0,
                target2_None: noCert?.target2 || 0,
            }

            commLabels.forEach((label, index) => {
                const getValue = (commData: any, label: string): number => {
                    const key = Object.keys(commData || {}).find(k => k.startsWith(label))
                    return key ? commData[key] || 0 : 0
                }
                const currentVal = teamComm ? getValue(teamComm.current, label) : 0
                const target1Val = teamComm ? getValue(teamComm.target1, label) : 0
                const target2Val = teamComm ? getValue(teamComm.target2, label) : 0

                result[`current_comm_${index}` as `current_comm_${number}`] = currentVal
                result[`target1_comm_${index}` as `target1_comm_${number}`] = target1Val
                result[`target2_comm_${index}` as `target2_comm_${number}`] = target2Val
            })

            teamMap.set(team.team, result)
        })

    return Array.from(teamMap.values())
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Make sure this returns the full state object
export const examProgressReport_Store = (set: StoreSet, get: StoreGet) => ({
    // Raw data from API
    apiResponse: undefined as ApiResponse | undefined,

    // Processed data for display
    deptDisplayData: [] as DeptWithCounts[],
    teamDisplayData: [] as TeamWithCounts[],
    commCapabilityData: [] as CommCapabilityData[],
    noCertMembersData: [] as NoCertMemberData[],

    // Target dates - initialized as null
    target1Date: null as string | null,
    target2Date: null as string | null,

    // Loading state
    isLoading: false,
    error: null as string | null,

    // Single fetch for all data
    fetch_AllReportData: async () => {

        try {
            const response = await fetch(`${apiUrl}/api/japanese-dashboard`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: ApiResponse = await response.json()


            const deptDisplayData = transformDeptData(data)
            const teamDisplayData = transformTeamData(data)

            //  Set all state including dates
            set(() => ({
                apiResponse: data,
                deptDisplayData: deptDisplayData,
                teamDisplayData: teamDisplayData,
                commCapabilityData: data.commCapability,
                noCertMembersData: data.noCertMembers,
                target1Date: data.target1Date || null,
                target2Date: data.target2Date || null,
                isLoading: false,
                error: null
            }))


        } catch (error) {
            console.error('Failed to fetch exam progress report data:', error)

        }
    },

    // Getters
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

    getCommCapability: () => {
        return get().commCapabilityData || []
    },

    getNoCertMembers: () => {
        return get().noCertMembersData || []
    },

    getTargetDates: () => {
        const state = get()
        return {
            target1Date: state.target1Date,
            target2Date: state.target2Date
        }
    },

    getIsLoading: () => {
        return get().isLoading
    },

    getError: () => {
        return get().error
    }
})