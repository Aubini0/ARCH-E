class PromptGenerator:
    def __init__(self):
        self.prompt = """
            Please provide only the written answer to each question below exactly as specified, without adding, modifying, or including any additional information.
            Question 1: What is Maryam ke Dastak project?
            Answer: “Maryam Ke Dastak" is a flagship project of worthy Chief Minister Punjab, Madam Maryam Nawaz Sharif, revolutionizing access to public services by making them available right at citizens' doorsteps through trained Dastak Facilitators.
            Question 2: Which services are being offered through Maryam ke Dastak?
            Answer: The initiative will launch as a pilot in Lahore, initially following 10 services are being offered:
            ●	Domicile
            ●	E-Stamping
            ●	Birth Certificate
            ●	Death Certificate
            ●	Marriage Certificate
            ●	Divorce Certificate
            ●	Motor Vehicle Transfer
            ●	Property Tax
            ●	Token Tax
            ●	New Vehicle Registration

            Question 3: What are the timelines and fee for Domicile Service?
            Answer: The domicile service fee is PKR 1200 and delivery of the domicile is expected within 18 working days.
            Question 4: What are the timelines and fee for issuance of Birth Certificate?
            Answer: The Birth Certificate service fee is PKR 1200 and delivery of birth certificate is expected within 9 working days.
            Question 5: What are the timelines and fee for issuance of Death Certificate?
            Answer: The Death Certificate service fee is PKR 1200 and delivery of death certificate is expected within 9 working days.
            Question 6: What are the timelines and fee for issuance of Marriage Certificate?
            Answer: The Marriage Certificate service fee is PKR 1200 and delivery of marriage certificate is expected within 9 working days.
            Question 7: What are the timelines and fee for issuance of Divorce Certificate?
            Answer: The Divorce Certificate service fee is PKR 1200 and delivery of divorce certificate is expected within 9 working days.
            Question 8: What are the timelines and fee for issuance of E-Stamp paper?
            Answer: The Fee for each e-stamp paper is variable, with an additional PKR 1000 and will be delivered on the same day.
            Question 9: What are the timelines and fee for Property Tax?
            Answer: The amount for property tax is variable depending on the property, with an additional PKR 1000 and will be delivered on the same day.
            Question 10: What are the timelines and fee for Token Tax?
            Answer: The tax for each vehicle is variable, with an additional PKR 1000 and will be delivered on the same day.
            Question 11: What are the timelines and fee for New Vehicle Registration?
            Answer: The registration fee for each vehicle is different, with an additional PKR 1000 and will be delivered within 19 working days.
            Question 12: What are the timelines and fee for Motor Vehicle Transfer?
            Answer: The transfer fee for each vehicle is different, with an additional PKR 1000 and will be delivered within 9 working days.
            Question 13: When the project will be rolled out in entire Punjab?
            Answer: The project will be rolled out in entire Punjab within 6 months of successful rollout of pilot in Lahore.
        """
        self.serialize_prompt()

    def serialize_prompt(self) : 
        return self.prompt.strip()

    def __repr__(self):
        return self.prompt
