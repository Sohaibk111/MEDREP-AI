export type CompanyDoctorAssignment = {
  companyDoctorId: string;
  name: string;
  qualification: string;
  class: 'A' | 'B';
  specialty: string;
  city: string;
  locationName: string;
  assignedMso: string;
  assignmentSource: 'COMPANY_WORKBOOK';
};

const COMPANY_ASSIGNMENT_ROWS: Array<[string,string,string,'A'|'B',string,string,string]> = [
['29810','Dr Imran Iftikha','FCPS','A','Cardiologist','Saidpur Road','RIC'],
['54093','Dr Muhammad Mohsin','FCPS','A','Cardiologist','Saidpur Road','RIC'],
['18385','Dr Saima Usman','FCPS','A','Medicine','Saidpur Road','Holy family hospital'],
['63411','Dr Nida Anjum','FCPS','B','Medicine','Saidpur Road','Holy family hospital'],
['64339','Dr Arif Khatana','FCPS','B','Medicine','Saidpur Road','Holy family hospital'],
['19341','Dr Haider Zaigham Buqai','FCPS','B','Medicine','Comercial Market','Fatima Clinic'],
['29860','Dr Azhar Ali','FCPS','B','Medicine','Saidpur Road','Hanif Hospital'],
['18713','Dr Nadeem Islam Sheikh','FCPS','B','Medicine','I-10','Capital Clinic'],
['18211','Dr Shakir Ali Rana','FCPS','B','Cardiologist','I-10','Family Hospital'],
['55115','Dr Irshad Khan','FCPS','B','Medicine','I-10','PAEC'],
['49810','Dr Fahad Mushtaq','FCPS','B','Medicine','I-10','PAEC'],
['61993','Dr Shaukat Ali Bachau','FCPS','B','Medicine','I-10','PAEC'],
['56956','Dr Matti Ullah','FCPS','B','Endocrinologist','H-8','Shifa Intr.Hospital'],
['53308','Dr Umar Yousuf Raja','FCPS','A','Endocrinologist','H-8','Shifa Intr.Hospital'],
['19247','Dr Jammal Zafar','FCPS','A','Endocrinologist','Saidpur Road','Hanif Hospital'],
['62473','Dr Rahila Amir','FCPS','B','Medicine','H-8','Shifa Intr.Hospital'],
['55849','Dr Nadia Saeed','FCPS','B','Medicine','H-8','Shifa Intr.Hospital'],
['43645','Dr Naheed Gul Khattak','FCPS','B','Medicine','H-8','Shifa Intr.Hospital'],
['18844','Dr Mazhar Mufti','FCPS','B','Medicine','H-8','Shifa Intr.Hospital'],
['56332','Dr Asad Akbar Khan','FCPS','B','Cardiologist','H-8','Shifa Intr.Hospital'],
['41564','Dr Saeed Ullah Shah','FCPS','B','Cardiologist','H-8','Shifa Intr.Hospital'],
['56004','Dr Kashif Jan','FCPS','B','Cardiologist','H-8','Shifa Intr.Hospital'],
['19833','Dr Ayesha Waqar Niaz','FCPS','B','Medicine','I-11','Nescom Hospital'],
['55100','Dr Madiha Butt','FCPS','B','Cardiologist','I-11','Nescom Hospital'],
['18838','Dr Maryam Mehboob','FCPS','B','Medicine','I-11','Nescom Hospital'],
['48841','Dr Nasir Abbasi','FCPS','B','Medicine','I-11','Nescom Hospital'],
['19443','Dr Faramas Ali Khan','FCPS','B','Medicine','I-10','IEESSI'],
['44765','Dr Madeeha Nazar','FCPS','B','Medicine','Saidpur Road','Holy family hospital'],
['18775','Dr Muhammad Khram','FCPS','B','Medicine','Saidpur Road','Holy family hospital'],
['52758','Dr Usman Zafar','FCPS','B','Medicine','Saidpur Road','Al Khidmat Razi Hospital'],
['43141','Dr Zahid Mehmood','FCPS','B','Diabetalogist','Saidpur Road','Hanif Hospital'],
['61278','Dr Akhtar Hussain','FCPS','A','Endocrinologist','Abbottabad','Ayub medical complex'],
['16565','Dr Atique Ur Rehman','FCPS','A','Medical Spltt','Abbottabad','Ayub medical complex'],
['47861','Dr Syed Ghulam Murtaza','FCPS','A','Diabetalogist','Abbottabad','Doctors Plaza'],
['47744','Dr Zabih Ullah','FCPS','A','Gasteroenterologist','Abbottabad','Allied Hospital'],
['16678','Dr Haider Zaman','FCPS','A','MEDICINE','Abbottabad','Oghi medical centre'],
['16614','Dr Shamim Anwar','FCPS','A','MEDICINE','Abbottabad','Shafeeq medical centre'],
['16608','Dr Nasir Shah Kazmi','FCPS','A','Medicine','Abbottabad','Awan Plaza'],
['62787','Dr Saima Hanif','FCPS','A','Endocrinologist','Abbottabad','Ayub medical complex'],
['62788','Dr Atif Hameed','FCPS','A','Endocrinologist','Abbottabad','Ayub medical complex'],
['64163','Dr Sumera Kazmi','FCPS','A','Medicine','Abbottabad','Shafique Plaza'],
['43804','Dr Bashir Ud Din','FCPS','A','Nephrologist','Abbottabad','D.H.Q'],
['62772','Dr Jamal Ahmad Khan','FCPS','A','Endocrinologist','Mansehra','Mansehra Medical Complex'],
['44769','Dr Iqbal Qasim','FCPs','A','Medicine','Mansehra','King Abdullah Hospital'],
['32526','Dr Arshad Naeem','FCPS','A','Medicine','Mansehra','King Abdullah Hospital'],
['46199','Dr Adeel Alam','FCPS','A','Medicine','Mansehra','Al Haider Laboratory'],
['46530','Dr Amir Shahzad','FCPS','A','Gasteroenterologist','Mansehra','King Abdullah Hospital'],
['20095','Dr Abdul Khalid','FCPS','A','Medicine','Muzaffarabad','Kashmir Surgical Hospital'],
['43307','Dr Robina Rafique Sheikh','FCPS','A','Medicine','Muzaffarabad','AIMS'],
['42970','Dr Umar Abdullah','FCPS','A','Medicine','Muzaffarabad','CMH Hospital'],
['29464','Dr Munazza Nazir','FCPS','A','Medicine','Muzaffarabad','Usman Plaza'],
['65144','Dr Mohteshim Manzoor','FCPS','A','Gasteroenterologist','Muzaffarabad','Usman Plaza']
];

export const COMPANY_DOCTOR_ASSIGNMENTS: readonly CompanyDoctorAssignment[] = COMPANY_ASSIGNMENT_ROWS.map(([companyDoctorId,name,qualification,doctorClass,specialty,city,locationName]) => ({
  companyDoctorId, name, qualification, class: doctorClass, specialty, city, locationName,
  assignedMso: 'Sohaib', assignmentSource: 'COMPANY_WORKBOOK'
}));

export const TWIN_CITIES = ['Rawalpindi', 'Islamabad'];
export const isTwinCityAssignment = (assignment: CompanyDoctorAssignment) => TWIN_CITIES.includes(assignment.city);
export const isOutstationAssignment = (assignment: CompanyDoctorAssignment) => !isTwinCityAssignment(assignment);
