
# Фейковый опыт работы
## Table of Contents
- [General Template](#general-template)
- [By profession](#by-profession)
  - your prompt could be here

## General template
### prompt itself
```
Generate a realistic, ATS-friendly work experience section for the position "{Profession}".  
Work experience in months: {ExperienceMonths} .  
The number of job positions must strictly match the number of values in {ExperienceMonths}.  
Job titles do not have to follow a strict Junior → Middle → Senior progression — variations are allowed (e.g., unspecified → Middle, unspecified → Senior, etc.).  
For each position, include:  
- Company name (use fake names like Company1, Company2, etc.).  
- Job title (it can be unspecified).  
- Work period (in months, based on {ExperienceMonths}).  
- Key responsibilities and achievements (3-5 bullet points).  
Provide the output in plain text format.  
```

### usage
```
Generate a realistic, ATS-friendly work experience section for the position "react frontend developer".  
Work experience in months: {ExperienceMonths} = [ 7, 14, 18].  
The number of job positions must strictly match the number of values in {ExperienceMonths}.  
Job titles do not have to follow a strict Junior → Middle → Senior progression — variations are allowed (e.g., unspecified → Middle, unspecified → Senior, etc.).  
For each position, include:  
- Company name (use fake names like Company1, Company2, etc.).  
- Job title (it can be unspecified).  
- Work period (in months, based on {ExperienceMonths}).  
- Key responsibilities and achievements (3-5 bullet points).  
Provide the output in plain text format.
```

### outputs
#### react frontend developer [ 7, 14, 18]
<details>
  <summary>chatgpt</summary>

  ```
  Work Experience

  Company1
  Job Title: React Frontend Developer
  Work Period: 7 months

  Developed dynamic and responsive web applications using React, leveraging modern JavaScript features.
  Collaborated with UI/UX designers to translate wireframes into intuitive user interfaces.
  Integrated RESTful APIs and GraphQL endpoints to enable seamless data interactions.
  Optimized application performance through code splitting and lazy loading techniques.
  Company2
  Job Title: Frontend Developer
  Work Period: 14 months

  Led the refactoring of legacy systems by introducing a component-based architecture with React.
  Implemented state management solutions (Redux) to streamline data flow and reduce bugs.
  Worked closely with backend teams to integrate complex APIs, ensuring robust application functionality.
  Mentored junior developers and conducted code reviews to maintain high coding standards.
  Company3
  Job Title: Senior React Developer
  Work Period: 18 months

  Architected and developed scalable, high-performance React applications from the ground up.
  Established best practices for component reuse, testing, and continuous integration in the frontend team.
  Enhanced user experience by optimizing load times and implementing responsive design principles.
  Coordinated with cross-functional teams to deliver innovative features under tight deadlines.
  Conducted performance tuning and debugging, achieving a significant improvement in application efficiency.
  ```

</details>

<details>
  <summary>deepseek</summary>

  ```

Frontend Developer
Company1 | 7 months

Developed and maintained responsive web applications using React.js, TypeScript, and modern frontend tooling.

Collaborated with UX/UI designers to translate Figma prototypes into pixel-perfect, interactive components.

Implemented state management using Redux Toolkit, reducing API call duplication by 30% in core workflows.

Optimized rendering performance of data-heavy dashboards by integrating virtualized lists and memoization techniques.

Contributed to a design system adoption that improved development velocity by 25% across 5 product teams.

Middle Frontend Engineer
Company2 | 14 months

Led the migration of legacy jQuery applications to a modern React-based architecture with Next.js.

Architected a reusable component library adopted by 12+ internal projects, reducing redundancy in UI code.

Integrated real-time features using WebSocket and React Query for a collaborative document editing platform.

Mentored 3 junior developers through code reviews and pair programming sessions.

Achieved 95% Lighthouse accessibility scores by overhauling semantic HTML and ARIA labeling practices.

Senior React Developer
Company3 | 18 months

Owned the frontend development lifecycle for a SaaS product serving 50k+ monthly active users.

Spearheaded the adoption of React Server Components and Streaming SSR to reduce time-to-interactive by 40%.

Designed a role-based permission system with dynamic UI rendering, supporting 15+ enterprise client configurations.

Automated visual regression testing using Storybook and Chromatic, catching 200+ UI bugs pre-production.

Led the transition from JavaScript to TypeScript across 8 repositories, improving code maintainability and reducing runtime errors by 60%.
```
</details>


#### system analyst [8, 12]
<details>
  <summary>chatgpt</summary>
  
  ```
Work Experience

Company1
Job Title: System Analyst
Work Period: 8 months
Key Responsibilities and Achievements:

Conducted comprehensive system analysis to identify operational inefficiencies and propose innovative solutions.
Collaborated with cross-functional teams to optimize IT processes and improve system integration.
Assisted in the design and deployment of system upgrades, ensuring minimal downtime during transitions.
Developed detailed technical documentation and provided training sessions for end-users, enhancing overall system adoption.
Company2
Job Title: Senior System Analyst
Work Period: 12 months
Key Responsibilities and Achievements:

Led critical system optimization projects, which resulted in a significant increase in operational efficiency.
Evaluated existing IT infrastructures and recommended strategic improvements to support business growth.
Coordinated with development teams to troubleshoot and resolve complex system issues, reducing system downtime.
Delivered in-depth performance analysis reports and presented actionable insights to senior management.
Played a pivotal role in overseeing system integration and migration projects, ensuring seamless transitions.
  ```
</details>

<details>
  <summary>deepseek</summary>
  
  ```
Company1
System Analyst | 8 months

Conducted requirements gathering and analysis for clients across 3 enterprise software projects, translating business needs into technical specifications.

Collaborated with developers and QA teams to design workflows, reducing process redundancies by 15% through improved system mapping.

Authored 50+ functional and technical documentation artifacts, including use cases, UML diagrams, and API integration guides.

Supported user acceptance testing (UAT), resolving 20+ critical defects before deployment deadlines.

Company2
Senior Business Systems Analyst | 12 months

Led a cross-functional team to implement a cloud-based ERP system, completing the $2M project 3 weeks ahead of schedule.

Streamlined data migration processes by developing SQL scripts, achieving 99.8% accuracy in legacy system data transfers.

Spearheaded stakeholder workshops to define KPIs for a customer relationship management (CRM) overhaul, boosting user adoption by 40%.

Automated monthly reporting using Power BI, reducing manual effort by 25 hours per month.

Mentored 2 junior analysts on Agile methodologies and stakeholder management best practices.
  ```
</details>

## By profession
- your prompt could be here
