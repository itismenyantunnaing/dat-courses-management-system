import { SkillSet_StoreType } from "../types"

const technical_tableHeader = [
    {
      "id": 1,
      "category_name": "Programming",
      "skill_sub_categories": [
        {
          "id": 101,
          "sub_category_name": "empty",
          "skills": [
            {
              "id": 1001,
              "skill_name": "C++"
            },
            {
              "id": 1002,
              "skill_name": "Python"
            },
            {
              "id": 1003,
              "skill_name": "Java"
            }
          ]
        },
        {
          "id": 102,
          "sub_category_name": "Backend",
          "skills": [
            {
              "id": 1004,
              "skill_name": "Spring Boot"
            },
            {
              "id": 1005,
              "skill_name": "Node.js"
            },
            {
              "id": 1006,
              "skill_name": "Django"
            }
          ]
        },
        {
          "id": 103,
          "sub_category_name": "Frontend",
          "skills": [
            {
              "id": 1007,
              "skill_name": "React"
            },
            {
              "id": 1008,
              "skill_name": "Vue.js"
            },
            {
              "id": 1009,
              "skill_name": "Angular"
            }
          ]
        }
      ]
    },
    {
      "id": 2,
      "category_name": "empty",
      "skill_sub_categories": [
        {
          "id": 201,
          "sub_category_name": "Database",
          "skills": [
            {
              "id": 2001,
              "skill_name": "Oracle"
            },
            {
              "id": 2002,
              "skill_name": "MySQL"
            },
            {
              "id": 2003,
              "skill_name": "PostgreSQL"
            }
          ]
        },
        {
          "id": 202,
          "sub_category_name": "Database",
          "skills": [
            {
              "id": 2004,
              "skill_name": "MongoDB"
            },
            {
              "id": 2005,
              "skill_name": "Redis"
            }
          ]
        }
      ]
    },
    {
      "id": 3,
      "category_name": "DevOps",
      "skill_sub_categories": [
        {
          "id": 301,
          "sub_category_name": "General",
          "skills": [
            {
              "id": 3001,
              "skill_name": "Docker"
            },
            {
              "id": 3002,
              "skill_name": "Kubernetes"
            },
            {
              "id": 3003,
              "skill_name": "Jenkins"
            }
          ]
        },
        {
          "id": 302,
          "sub_category_name": "Cloud",
          "skills": [
            {
              "id": 3004,
              "skill_name": "AWS"
            },
            {
              "id": 3005,
              "skill_name": "Azure"
            },
            {
              "id": 3006,
              "skill_name": "GCP"
            }
          ]
        }
      ]
    }
  ];


const skillData = [
  // Employee 1002 - Jane Smith's skills
  {
    employee_id: "1002",
    skill_id: 1002,
    skill_name: "Python",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 102,
    sub_category_name: "Backend",
    years_of_experience: 7.0,
    experience_level: "Expert"
  },
  {
    employee_id: "1002",
    skill_id: 2003,
    skill_name: "PostgreSQL",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 201,
    sub_category_name: "General",
    years_of_experience: 6.0,
    experience_level: "Architecture"
  },
  {
    employee_id: "1002",
    skill_id: 2004,
    skill_name: "MongoDB",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 202,
    sub_category_name: "NoSQL",
    years_of_experience: 4.5,
    experience_level: "Optimization"
  },
  
  // Employee 1003 - Mike Johnson's skills
  {
    employee_id: "1003",
    skill_id: 1007,
    skill_name: "React",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 103,
    sub_category_name: "Frontend",
    years_of_experience: 3.5,
    experience_level: "Component Design"
  },
  {
    employee_id: "1003",
    skill_id: 3005,
    skill_name: "Azure",
    category_id: 3,
    category_name: "DevOps",
    sub_category_id: 302,
    sub_category_name: "Cloud",
    years_of_experience: 1.5,
    experience_level: "Deployment"
  },
  
  // Employee 1004 - Sarah Wilson's skills
  {
    employee_id: "1004",
    skill_id: 1008,
    skill_name: "Vue.js",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 103,
    sub_category_name: "Frontend",
    years_of_experience: 4.0,
    experience_level: "Type Safety"
  },
  {
    employee_id: "1004",
    skill_id: 1005,
    skill_name: "Node.js",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 102,
    sub_category_name: "Backend",
    years_of_experience: 4.0,
    experience_level: "API Development"
  },
  {
    employee_id: "1004",
    skill_id: 2002,
    skill_name: "MySQL",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 201,
    sub_category_name: "General",
    years_of_experience: 5.0,
    experience_level: "Query Optimization"
  },
  
  // Employee 1005 - David Brown's skills
  {
    employee_id: "1005",
    skill_id: 2001,
    skill_name: "Oracle",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 201,
    sub_category_name: "General",
    years_of_experience: 8.0,
    experience_level: "Database Administration"
  },
  {
    employee_id: "1005",
    skill_id: 2005,
    skill_name: "Redis",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 202,
    sub_category_name: "NoSQL",
    years_of_experience: 3.0,
    experience_level: "Caching"
  },
  
  // Employee 1006 - Emily Chen's skills
  {
    employee_id: "1006",
    skill_id: 1009,
    skill_name: "Angular",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 103,
    sub_category_name: "Frontend",
    years_of_experience: 6.5,
    experience_level: "Framework Expert"
  },
  {
    employee_id: "1006",
    skill_id: 1003,
    skill_name: "Java",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 101,
    sub_category_name: "General",
    years_of_experience: 5.0,
    experience_level: "Microservices"
  },
  {
    employee_id: "1006",
    skill_id: 3004,
    skill_name: "AWS",
    category_id: 3,
    category_name: "DevOps",
    sub_category_id: 302,
    sub_category_name: "Cloud",
    years_of_experience: 4.0,
    experience_level: "Cloud Architecture"
  },
  {
    employee_id: "1006",
    skill_id: 3006,
    skill_name: "GCP",
    category_id: 3,
    category_name: "DevOps",
    sub_category_id: 302,
    sub_category_name: "Cloud",
    years_of_experience: 2.0,
    experience_level: "Migration"
  },
  
  // Employee 1008 - Lisa Anderson's skills
  {
    employee_id: "1008",
    skill_id: 1002,
    skill_name: "Python",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 102,
    sub_category_name: "Backend",
    years_of_experience: 2.5,
    experience_level: "Scripting"
  },
  {
    employee_id: "1008",
    skill_id: 2004,
    skill_name: "MongoDB",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 202,
    sub_category_name: "NoSQL",
    years_of_experience: 2.0,
    experience_level: "Data Modeling"
  },
  
  // Employee 1009 - James Martinez's skills
  {
    employee_id: "1009",
    skill_id: 1007,
    skill_name: "React",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 103,
    sub_category_name: "Frontend",
    years_of_experience: 5.0,
    experience_level: "State Management"
  },
  {
    employee_id: "1009",
    skill_id: 1005,
    skill_name: "Node.js",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 102,
    sub_category_name: "Backend",
    years_of_experience: 4.5,
    experience_level: "Real-time Apps"
  },
  {
    employee_id: "1009",
    skill_id: 3005,
    skill_name: "Azure",
    category_id: 3,
    category_name: "DevOps",
    sub_category_id: 302,
    sub_category_name: "Cloud",
    years_of_experience: 3.0,
    experience_level: "DevOps"
  },
  {
    employee_id: "1009",
    skill_id: 2003,
    skill_name: "PostgreSQL",
    category_id: 2,
    category_name: "Database",
    sub_category_id: 201,
    sub_category_name: "General",
    years_of_experience: 4.0,
    experience_level: "Performance Tuning"
  },
  
  // Employee 1010 - Maria Garcia's skills
  {
    employee_id: "1010",
    skill_id: 1008,
    skill_name: "Vue.js",
    category_id: 1,
    category_name: "Programming",
    sub_category_id: 103,
    sub_category_name: "Frontend",
    years_of_experience: 3.0,
    experience_level: "Type Integration"
  },
  {
    employee_id: "1010",
    skill_id: 3006,
    skill_name: "GCP",
    category_id: 3,
    category_name: "DevOps",
    sub_category_id: 302,
    sub_category_name: "Cloud",
    years_of_experience: 1.0,
    experience_level: "Setup"
  }
];

const developement_capability_tableHeader = [
  {
    id: 1,
    development_type: "Host/Online"
  },
  {
    id: 2,
    development_type: "Host/Batch"
  },
  {
    id: 3,
    development_type: "Decentralized/Online"
  },
  {
    id: 4,
    development_type: "Distributed/Batch"
  },
]

const development_capability_data = [
  // Employee 1002 - Jane Smith
  {
    employee_id: "1002",
    development_type_id: 1,
    development_type_name: "Host/Online",
    process_name: "Agile Development",
    years_of_experience: 5.0
  },
  {
    employee_id: "1002",
    development_type_id: 2,
    development_type_name: "Host/Batch",
    process_name: "Batch Processing",
    years_of_experience: 3.5
  },
  
  // Employee 1003 - Mike Johnson
  {
    employee_id: "1003",
    development_type_id: 3,
    development_type_name: "Decentralized/Online",
    process_name: "Distributed Systems",
    years_of_experience: 4.0
  },
  
  // Employee 1004 - Sarah Wilson
  {
    employee_id: "1004",
    development_type_id: 1,
    development_type_name: "Host/Online",
    process_name: "Web Development",
    years_of_experience: 4.5
  },
  {
    employee_id: "1004",
    development_type_id: 4,
    development_type_name: "Distributed/Batch",
    process_name: "ETL Pipelines",
    years_of_experience: 3.0
  },
  
  // Employee 1005 - David Brown
  {
    employee_id: "1005",
    development_type_id: 2,
    development_type_name: "Host/Batch",
    process_name: "Data Warehousing",
    years_of_experience: 6.0
  },
  
  // Employee 1006 - Emily Chen
  {
    employee_id: "1006",
    development_type_id: 1,
    development_type_name: "Host/Online",
    process_name: "Microservices",
    years_of_experience: 5.5
  },
  {
    employee_id: "1006",
    development_type_id: 3,
    development_type_name: "Decentralized/Online",
    process_name: "Cloud Native",
    years_of_experience: 4.0
  },
  {
    employee_id: "1006",
    development_type_id: 4,
    development_type_name: "Distributed/Batch",
    process_name: "Big Data Processing",
    years_of_experience: 3.5
  },
  
  // Employee 1008 - Lisa Anderson
  {
    employee_id: "1008",
    development_type_id: 1,
    development_type_name: "Host/Online",
    process_name: "API Development",
    years_of_experience: 2.0
  },
  
  // Employee 1009 - James Martinez
  {
    employee_id: "1009",
    development_type_id: 1,
    development_type_name: "Host/Online",
    process_name: "Full Stack",
    years_of_experience: 4.5
  },
  {
    employee_id: "1009",
    development_type_id: 3,
    development_type_name: "Decentralized/Online",
    process_name: "Blockchain",
    years_of_experience: 2.5
  },
  
  // Employee 1010 - Maria Garcia
  {
    employee_id: "1010",
    development_type_id: 2,
    development_type_name: "Host/Batch",
    process_name: "Report Generation",
    years_of_experience: 3.0
  }
];

const languageSkillData = [
  {
    employee_id: "1002",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1003",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1004",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1005",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1006",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1007",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1008",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1009",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1010",
    language_skill_level: 1,
    jlpt_highest_level: "N5"
  },
  {
    employee_id: "1011",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1012",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1013",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1014",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1015",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1016",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1017",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1018",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1019",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1020",
    language_skill_level: 1,
    jlpt_highest_level: "N5"
  },
  {
    employee_id: "1021",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1022",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1023",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1024",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1025",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1026",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  },
  {
    employee_id: "1027",
    language_skill_level: 5,
    jlpt_highest_level: "N1"
  },
  {
    employee_id: "1028",
    language_skill_level: 2,
    jlpt_highest_level: "N4"
  },
  {
    employee_id: "1029",
    language_skill_level: 3,
    jlpt_highest_level: "N3"
  },
  {
    employee_id: "1030",
    language_skill_level: 4,
    jlpt_highest_level: "N2"
  }
];

const managementScoresData = [
  {
    employee_id: "1002",
    management_experience_level: 4,
    qcd_score: 3,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.5
  },
  {
    employee_id: "1003",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 2,
    total_level: 2.5
  },
  {
    employee_id: "1004",
    management_experience_level: 3,
    qcd_score: 4,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.5
  },
  {
    employee_id: "1005",
    management_experience_level: 1,
    qcd_score: 2,
    report_consult_score: 2,
    education_score: 1,
    total_level: 1.5
  },
  {
    employee_id: "1006",
    management_experience_level: 4,
    qcd_score: 4,
    report_consult_score: 4,
    education_score: 4,
    total_level: 4.0
  },
  {
    employee_id: "1007",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 2,
    education_score: 2,
    total_level: 2.0
  },
  {
    employee_id: "1008",
    management_experience_level: 1,
    qcd_score: 2,
    report_consult_score: 2,
    education_score: 1,
    total_level: 1.5
  },
  {
    employee_id: "1009",
    management_experience_level: 3,
    qcd_score: 3,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.0
  },
  {
    employee_id: "1010",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 2,
    total_level: 2.5
  },
  {
    employee_id: "1011",
    management_experience_level: 5,
    qcd_score: 4,
    report_consult_score: 5,
    education_score: 4,
    total_level: 4.5
  },
  {
    employee_id: "1012",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 2,
    total_level: 2.5
  },
  {
    employee_id: "1013",
    management_experience_level: 3,
    qcd_score: 3,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.0
  },
  {
    employee_id: "1014",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 2,
    total_level: 2.5
  },
  {
    employee_id: "1015",
    management_experience_level: 4,
    qcd_score: 4,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.5
  },
  {
    employee_id: "1016",
    management_experience_level: 2,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 2,
    total_level: 2.5
  },
  {
    employee_id: "1017",
    management_experience_level: 3,
    qcd_score: 3,
    report_consult_score: 3,
    education_score: 3,
    total_level: 3.0
  },
  {
    employee_id: "1018",
    management_experience_level: 4,
    qcd_score: 4,
    report_consult_score: 4,
    education_score: 4,
    total_level: 4.0
  },
  {
    employee_id: "1019",
    management_experience_level: 3,
    qcd_score: 3,
    report_consult_score: 4,
    education_score: 3,
    total_level: 3.0
  },
  {
    employee_id: "1020",
    management_experience_level: 1,
    qcd_score: 2,
    report_consult_score: 2,
    education_score: 1,
    total_level: 1.5
  },
  {
    employee_id: "1021",
    management_experience_level: 4,
    qcd_score: 4,
    report_consult_score: 4,
    education_score: 4,
    total_level: 4.0
  }
];



type StoreSet = (fn: (state: SkillSet_StoreType) => Partial<SkillSet_StoreType>) => void;
type StoreGet = () => SkillSet_StoreType;

export const skillSetDataStore = (set: StoreSet, get: StoreGet) => ({
  fetch_SkillData: async () => {
    set(() => ({ skillData: skillData }));
  },

  fetch_SkillHeaders: async () => {
    set(() => ({ skill_headers: technical_tableHeader }));
  },

  fetch_devCapHeaders: async () => {
    set(() => ({ devCap_headers: developement_capability_tableHeader }));
  },

  fetch_devCapData: async () => {
    set(() => ({ devCap_data: development_capability_data}));
  },

  fetch_languageSkillData: async () => {
    set(() => ({ languageSkill_data: languageSkillData}));
  },

  fetch_managementScoreData: async () => {
    set(() => ({ managementScores_Data: managementScoresData}))
  }
});