const tableHeader = {
  "skill_categories": [
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
  ]
};


const skillData = [
  // Employee 1002 - Jane Smith's skills
  {
    employee_id: 1002,
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
    employee_id: 1002,
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
    employee_id: 1002,
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
    employee_id: 1003,
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
    employee_id: 1003,
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
    employee_id: 1004,
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
    employee_id: 1004,
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
    employee_id: 1004,
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
    employee_id: 1005,
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
    employee_id: 1005,
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
    employee_id: 1006,
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
    employee_id: 1006,
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
    employee_id: 1006,
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
    employee_id: 1006,
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
    employee_id: 1008,
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
    employee_id: 1008,
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
    employee_id: 1009,
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
    employee_id: 1009,
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
    employee_id: 1009,
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
    employee_id: 1009,
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
    employee_id: 1010,
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
    employee_id: 1010,
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

export const skillDataStore = (set, get) => ({
  fetch_SkillData: async () => {
    set({ skillData: skillData });
  },

  fetch_SkillHeaders: async () => {
    set({ skill_headers: tableHeader.skill_categories });
  }
});