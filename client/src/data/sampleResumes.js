// Original sample resumes written for this app, formatted in the style of a professional CV
// (executive summary, key skills, experience with quantified bullets, education) but scoped to
// internship-level students rather than reproducing any real service's copyrighted content.

export const SAMPLE_RESUMES = [
  {
    id: 'resume-swe',
    role: 'Software Engineering Intern',
    field: 'Technology',
    name: 'Rachel Tan',
    tagline: 'Aspiring Software Engineer',
    summary: [
      'Final-year Computer Science student with hands-on experience building full-stack web applications and a strong grasp of data structures and algorithms.',
      'Contributed to two open-source projects and led a 4-person team to ship a class project used by 300+ students.',
      'Comfortable moving between frontend and backend, with a growing interest in distributed systems.',
    ],
    keySkills: ['Full-Stack Development', 'REST APIs', 'Agile/Scrum', 'Version Control (Git)', 'Unit Testing', 'Cross-Functional Collaboration'],
    experience: [
      {
        title: 'Teaching Assistant, Data Structures & Algorithms',
        org: 'National University of Singapore',
        dateRange: 'Aug 2025 – Present',
        bullets: [
          'Hold weekly office hours for 60+ students, improving average assignment pass rate from 72% to 89% after introducing a shared debugging checklist.',
          'Built an auto-grading script that cut grading turnaround from 2 weeks to 4 days.',
        ],
      },
      {
        title: 'Personal Project — StudySync',
        org: 'Independent',
        dateRange: 'Jan 2025 – May 2025',
        bullets: [
          'Led a 4-person team to build a full-stack study-group matching platform (React, Node.js, PostgreSQL) used by 300+ students.',
          'Set up CI with GitHub Actions and wrote integration tests covering 85% of backend routes.',
        ],
      },
    ],
    technicalSkills: ['Python', 'JavaScript/TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
    education: 'B.Comp (Computer Science), National University of Singapore — Expected 2027',
  },
  {
    id: 'resume-data-analyst',
    role: 'Data Analyst Intern',
    field: 'Analytics',
    name: 'Kevin Wong',
    tagline: 'Aspiring Data Analyst',
    summary: [
      'Business Analytics student with a track record of turning messy datasets into decisions, through a capstone project and a part-time analytics role.',
      'Comfortable across the pipeline from cleaning raw data to building the dashboard stakeholders actually use.',
    ],
    keySkills: ['Data Cleaning', 'Data Visualization', 'Statistical Analysis', 'Stakeholder Communication', 'A/B Testing'],
    experience: [
      {
        title: 'Analytics Intern (Part-Time)',
        org: 'Local E-Commerce Startup',
        dateRange: 'Mar 2025 – Present',
        bullets: [
          'Built a weekly sales dashboard in Tableau, cutting the time the ops team spent compiling reports by hand from 3 hours to 15 minutes.',
          'Ran an A/B test on checkout page copy that increased conversion by 6%.',
        ],
      },
      {
        title: 'Capstone Project — Customer Churn Analysis',
        org: 'NTU Business Analytics Programme',
        dateRange: 'Aug 2024 – Dec 2024',
        bullets: [
          'Cleaned and modeled a 50,000-row telecom customer dataset using Python (pandas) and built a logistic regression model achieving 81% accuracy.',
          'Presented findings and a retention recommendation to a panel of faculty and industry judges.',
        ],
      },
    ],
    technicalSkills: ['Python (pandas, scikit-learn)', 'SQL', 'Tableau', 'Excel', 'R'],
    education: 'B.Sc (Hons) Business Analytics, Nanyang Technological University — Expected 2026',
  },
  {
    id: 'resume-investment-analyst',
    role: 'Investment Analyst Intern (SG)',
    field: 'Finance',
    name: 'Priya Nair',
    tagline: 'Aspiring Investment Analyst',
    summary: [
      'Economics student with a CFA Level I candidacy in progress and hands-on equity research experience from a student-run investment fund.',
      'Strong quantitative foundation paired with clear, concise writing for investment memos.',
    ],
    keySkills: ['Equity Research', 'Financial Modeling', 'DCF & Comparable Company Analysis', 'Bloomberg Terminal', 'Investment Memo Writing'],
    experience: [
      {
        title: 'Analyst, Student Investment Fund',
        org: 'SMU Investment Club',
        dateRange: 'Aug 2024 – Present',
        bullets: [
          'Built a DCF model for a Singapore-listed REIT that informed a $15,000 allocation decision by the fund committee.',
          'Co-authored 3 investment memos presented to a panel of alumni portfolio managers.',
        ],
      },
      {
        title: 'Part-Time Research Assistant',
        org: 'SMU School of Economics',
        dateRange: 'Jan 2024 – Jun 2024',
        bullets: [
          'Compiled and cleaned a dataset of 200+ SGX-listed companies for a faculty research paper on dividend policy.',
        ],
      },
    ],
    technicalSkills: ['Excel (Financial Modeling)', 'Bloomberg Terminal', 'Python (basic)', 'PowerPoint'],
    education: 'B.Sc (Hons) Economics, Singapore Management University — Expected 2026',
    note: 'CFA Level I candidate (exam scheduled)',
  },
  {
    id: 'resume-cybersecurity',
    role: 'Cybersecurity Intern (SG)',
    field: 'Technology',
    name: 'Daniel Lim',
    tagline: 'Aspiring Security Analyst',
    summary: [
      'Information Security student who competes actively in CTFs and has built home-lab projects around network defense and vulnerability scanning.',
      'Comfortable working through the CIA triad in practice, not just in theory.',
    ],
    keySkills: ['Vulnerability Assessment', 'Network Security Fundamentals', 'Incident Response Basics', 'Security Awareness'],
    experience: [
      {
        title: 'Capture-the-Flag Team Member',
        org: 'NUS Greyhats',
        dateRange: 'Aug 2024 – Present',
        bullets: [
          'Placed top 15% in a national inter-university CTF, specializing in web exploitation challenges.',
          'Ran a workshop for 30 juniors on basic SQL injection and XSS detection.',
        ],
      },
      {
        title: 'Home Lab Project — Network Intrusion Detection',
        org: 'Independent',
        dateRange: 'Jun 2025 – Aug 2025',
        bullets: [
          'Set up a Suricata-based IDS in a virtualized home lab and tuned rules to reduce false positives by 40%.',
          'Documented the setup as a public write-up that received positive feedback from 3 industry mentors.',
        ],
      },
    ],
    technicalSkills: ['Linux', 'Wireshark', 'Nmap', 'Suricata', 'Python (scripting)', 'Basic Cloud Security (AWS)'],
    education: 'B.Comp (Information Security), National University of Singapore — Expected 2027',
  },
  {
    id: 'resume-mechanical-engineer',
    role: 'Mechanical Engineering Intern',
    field: 'Engineering',
    name: 'Farah Aziz',
    tagline: 'Aspiring Mechanical Engineer',
    summary: [
      'Mechanical Engineering student with CAD and hands-on prototyping experience from two years on the school Formula SAE team.',
      'Balances design intuition with a habit of validating everything against simulation and real test data.',
    ],
    keySkills: ['CAD Modeling (SolidWorks)', 'Finite Element Analysis', 'Prototyping', 'Technical Drawing', 'Root Cause Analysis'],
    experience: [
      {
        title: 'Suspension Sub-Team Lead',
        org: 'NUS Formula SAE Team',
        dateRange: 'Aug 2024 – Present',
        bullets: [
          'Redesigned the front suspension geometry, reducing unsprung mass by 12% versus the prior season\'s car.',
          'Ran FEA simulations in SolidWorks to validate part strength before manufacturing, catching a design flaw that would have failed under load.',
        ],
      },
      {
        title: 'Manufacturing Attachment',
        org: 'Precision Components Pte Ltd',
        dateRange: 'May 2025 – Jul 2025',
        bullets: [
          'Shadowed the production engineering team and proposed a jig redesign that cut assembly time on one line by 8%.',
        ],
      },
    ],
    technicalSkills: ['SolidWorks', 'ANSYS (basic FEA)', 'MATLAB', 'GD&T', 'Manual Machining Basics'],
    education: 'B.Eng (Hons) Mechanical Engineering, National University of Singapore — Expected 2027',
  },
];
