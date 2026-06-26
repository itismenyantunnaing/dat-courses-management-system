// In types/exam_progress_report.ts

export interface ApiResponse {
  byDepartment: DepartmentData[];
  byTeam: TeamData[];
  byTeamComm: TeamCommData[];
  commCapability: CommCapabilityData[];
  noCertMembers: NoCertMemberData[];
  target1Date: string | null;
  target2Date: string | null;
}

export interface DepartmentData {
  id: number;           // ✅ Added
  department: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  none: number;
  total: number;
}

export interface LevelCounts {
  N1: number;
  N2: number;
  N3: number;
  N4: number;
  N5: number;
}

export interface TeamData {
  team: string;
  deptId: number;       // ✅ Added
  current: LevelCounts;
  target1: LevelCounts;
  target2: LevelCounts;
}

// These remain unchanged
export interface CommLevelCounts {
  "Level 0 | None": number;
  "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words": number;
  "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool": number;
  "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words": number;
  "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation": number;
  "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese": number;
  "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, can Participate/discuss with Japanese Customers": number;
  "Level 3 | Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal": number;
}

export interface TeamCommData {
  current: CommLevelCounts;
  target1: CommLevelCounts;
  target2: CommLevelCounts;
  team: string;
}

export interface CommCapabilityData {
  current: number;
  level: string;
  target1: number;
  target2: number;
}

export interface NoCertMemberData {
  current: number;
  target1: number;
  target2: number;
  team: string;
}

// Frontend display types
export interface DeptWithCounts {
  id: number;           // ✅ Added
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
  // Dynamic communication fields
  [key: `current_comm_${number}`]: number;
  [key: `target1_comm_${number}`]: number;
  [key: `target2_comm_${number}`]: number;
}