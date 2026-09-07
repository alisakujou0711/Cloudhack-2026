// Hardcoded / researched baseline requirements for MVP demo (Singapore, subset of majors).
// Figures are indicative of publicly known admission ranges, simplified for a hackathon demo —
// not official cutoffs and should not be used for real advising.

const UNIVERSITIES = {
  NUS: {
    name: 'National University of Singapore',
    majors: {
      'Computer Science': {
        minGpa: 3.7, // out of 4.0, or equivalent
        competitiveness: 'Very High',
        requiredSubjects: ['Mathematics', 'Additional Mathematics'],
        preferredSubjects: ['Computing / Computer Science', 'Physics'],
        requiredQualifications: [
          'Strong H2 Mathematics (or equivalent) grade',
          'English proficiency (or equivalent)',
        ],
        essentialExtracurriculars: [
          'Demonstrated coding projects (personal, school, or competition)',
        ],
        notes:
          'Among the most selective programs in Singapore; competitive applicants typically show strong math grades plus visible CS-related projects or competitions (e.g. NOI, hackathons).',
      },
      'Business Administration': {
        minGpa: 3.5,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Economics', 'Principles of Accounts'],
        requiredQualifications: ['English proficiency (or equivalent)'],
        essentialExtracurriculars: [
          'Leadership roles (CCA, student council, or organized initiatives)',
        ],
        notes:
          'Holistic admission — leadership and communication evidence matters alongside grades.',
      },
      Engineering: {
        minGpa: 3.6,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics', 'Physics'],
        preferredSubjects: ['Additional Mathematics', 'Chemistry'],
        requiredQualifications: ['Strong H2 Math and Physics (or equivalent)'],
        essentialExtracurriculars: ['Design/build projects, robotics, or STEM competitions'],
        notes: 'Math and Physics grades are heavily weighted; project experience is a plus.',
      },
    },
  },
  NTU: {
    name: 'Nanyang Technological University',
    majors: {
      'Computer Science': {
        minGpa: 3.6,
        competitiveness: 'Very High',
        requiredSubjects: ['Mathematics', 'Additional Mathematics'],
        preferredSubjects: ['Computing / Computer Science'],
        requiredQualifications: ['Strong H2 Mathematics (or equivalent) grade'],
        essentialExtracurriculars: ['Coding portfolio or competition record recommended'],
        notes: 'Very high demand program; similar competitiveness to NUS CS.',
      },
      'Business Administration': {
        minGpa: 3.4,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Economics'],
        requiredQualifications: ['English proficiency (or equivalent)'],
        essentialExtracurriculars: ['Leadership or entrepreneurial experience'],
        notes: 'Nanyang Business School places weight on leadership narrative in essays.',
      },
      Engineering: {
        minGpa: 3.5,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics', 'Physics'],
        preferredSubjects: ['Additional Mathematics'],
        requiredQualifications: ['Strong H2 Math and Physics (or equivalent)'],
        essentialExtracurriculars: ['STEM projects or competitions'],
        notes: 'Strong emphasis on quantitative subject performance.',
      },
    },
  },
  SMU: {
    name: 'Singapore Management University',
    majors: {
      'Business Administration': {
        minGpa: 3.3,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Economics', 'Principles of Accounts'],
        requiredQualifications: ['English proficiency (or equivalent)', 'Interview performance'],
        essentialExtracurriculars: [
          'Leadership, CCA involvement, or community project participation',
        ],
        notes:
          'SMU interviews all shortlisted applicants — communication and leadership stories matter as much as grades.',
      },
      'Information Systems': {
        minGpa: 3.3,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Computing / Computer Science', 'Additional Mathematics'],
        requiredQualifications: ['English proficiency (or equivalent)', 'Interview performance'],
        essentialExtracurriculars: ['Any tech-related project or internship exposure'],
        notes: 'Blends business and tech; interview assesses communication and problem solving.',
      },
      Economics: {
        minGpa: 3.3,
        competitiveness: 'Medium',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Economics'],
        requiredQualifications: ['English proficiency (or equivalent)', 'Interview performance'],
        essentialExtracurriculars: ['Debate, MUN, or analytical/research projects'],
        notes: 'Less oversubscribed than SMU flagship programs, still requires solid quant grades.',
      },
    },
  },
  SUTD: {
    name: 'Singapore University of Technology and Design',
    majors: {
      'Information Systems Technology and Design': {
        minGpa: 3.6,
        competitiveness: 'Very High',
        requiredSubjects: ['Mathematics', 'Additional Mathematics'],
        preferredSubjects: ['Computing / Computer Science', 'Physics'],
        requiredQualifications: [
          'Strong H2 Mathematics (or equivalent) grade',
          'Portfolio or design/coding project submission recommended',
        ],
        essentialExtracurriculars: ['Design or coding projects showing an iterative build process'],
        notes:
          "SUTD's flagship tech pillar; admissions favor applicants who show design-thinking alongside technical skill, not just grades.",
      },
      'Engineering Product Development': {
        minGpa: 3.5,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics', 'Physics'],
        preferredSubjects: ['Additional Mathematics', 'Design & Technology'],
        requiredQualifications: ['Strong H2 Math and Physics (or equivalent)'],
        essentialExtracurriculars: ['Hands-on build/prototyping projects, robotics, or maker portfolio'],
        notes: 'Weighs demonstrated prototyping/making experience heavily alongside quant grades.',
      },
      'Architecture and Sustainable Design': {
        minGpa: 3.4,
        competitiveness: 'High',
        requiredSubjects: ['Mathematics'],
        preferredSubjects: ['Art', 'Design & Technology'],
        requiredQualifications: ['Design portfolio recommended at interview stage'],
        essentialExtracurriculars: ['Design portfolio or sustainability-related project work'],
        notes: 'Holistic admission with strong emphasis on a design portfolio, not just grades.',
      },
    },
  },
};

module.exports = { UNIVERSITIES };
