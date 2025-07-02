/*
  # Add Default CISSP Questions

  1. New Data
    - Inserts 21 high-quality CISSP practice questions
    - Covers Security and Risk Management and Asset Security domains
    - All questions are marked as Hard difficulty
    - Questions include detailed explanations and relevant tags
    - Created by system user (null created_by for default questions)

  2. Content
    - Professional-grade CISSP exam-style questions
    - Realistic scenarios and technical concepts
    - Comprehensive explanations for learning
    - Proper tagging for organization
*/

-- Insert default CISSP questions
INSERT INTO questions (domain, difficulty, question, options, correct_answer, explanation, tags, created_by, is_active) VALUES

-- Security and Risk Management Questions
(
  'Security and Risk Management',
  'Hard',
  'Wanda is working with one of her organization''s European Union business partners to facilitate the exchange of customer information. Wanda''s organization is located in the United States. What would be the best method for Wanda to use to ensure GDPR compliance?',
  '["Binding corporate rules", "Privacy Shield", "Standard contractual clauses", "Safe harbor"]'::jsonb,
  2,
  'The European Union provides standard contractual clauses that may be used to facilitate data transfer. That would be the best choice in a case where two different companies are sharing data. If the data was being shared internally within a company, binding corporate rules would also be an option. The EU/U.S. Privacy Shield was a safe harbor agreement that would previously have allowed the transfer but is no longer valid.',
  '["GDPR", "Data Transfer", "Legal Compliance"]'::jsonb,
  null,
  true
),

(
  'Security and Risk Management',
  'Hard',
  'Which one of the following principles imposes a standard of care upon an individual that is broad and equivalent to what one would expect from a reasonable person under the circumstances?',
  '["Due diligence", "Separation of duties", "Due care", "Least privilege"]'::jsonb,
  2,
  'The due care principle states that an individual should react in a situation using the same level of care that would be expected from any reasonable person. It is a very broad standard. The due diligence principle is a more specific component of due care that states that an individual assigned a responsibility should exercise due care to complete it accurately and in a timely manner.',
  '["Due Care", "Legal Compliance", "Professional Ethics"]'::jsonb,
  null,
  true
),

(
  'Security and Risk Management',
  'Hard',
  'Which of the following would normally be considered a supply chain risk?',
  '["Adversary tampering with hardware prior to being shipped to the end customer", "Adversary hacking into a web server run by the organization in an IaaS environment", "Adversary using social engineering to compromise an employee of a SaaS vendor to gain access to customer accounts", "Adversary conducting a denial-of-service attack using a botnet"]'::jsonb,
  0,
  'Supply chain risks occur when the adversary is interfering with the delivery of goods or services from a supplier to the customer. This might involve tampering with hardware before the customer receives it or using social engineering to compromise a vendor employee. Hacking into a web server run in an infrastructure-as-a-service (IaaS) environment is not a supply chain risk because the web server is already under the control of the customer. Using a botnet to conduct a denial-of-service attack does not involve any supply chain elements.',
  '["Supply Chain Security", "Risk Management", "Third-Party Risk"]'::jsonb,
  null,
  true
),

-- Asset Security Questions
(
  'Asset Security',
  'Hard',
  'What issue is common to spare sectors and bad sectors on hard drives as well as overprovisioned space on modern SSDs?',
  '["They can be used to hide data.", "They can only be degaussed.", "They are not addressable, resulting in data remanence.", "They may not be cleared, resulting in data remanence."]'::jsonb,
  3,
  'Spare sectors, bad sectors, and space provided for wear leveling on SSDs (overprovisioned space) may all contain data that was written to the space that will not be cleared when the drive is wiped. This is a form of data remanence and is a concern for organizations that do not want data to potentially be accessible. Many wiping utilities deal only with currently addressable space on the drive. SSDs cannot be degaussed, and wear leveling space cannot be reliably used to hide data. These spaces are still addressable by the drive, although they may not be seen by the operating system.',
  '["Data Remanence", "SSD", "Data Sanitization", "Storage Security"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Chris is responsible for workstations throughout his company and knows that some of the company''s workstations are used to handle both proprietary information and highly sensitive trade secrets. Which option best describes what should happen at the end of their life (EOL) for workstations he is responsible for?',
  '["Erasing", "Clearing", "Sanitization", "Destruction"]'::jsonb,
  3,
  'Destruction is the most complete method of ensuring that data cannot be exposed, and organizations often opt to destroy either the drive or the entire workstation or device to ensure that data cannot be recovered or exposed. Sanitization is a combination of processes that ensure that data from a system cannot be recovered by any means. Erasing and clearing are both prone to mistakes and technical problems that can result in remnant data and don''t make sense for systems that handle proprietary information.',
  '["Data Destruction", "Data Sanitization", "Asset Disposal"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Fred wants to classify his organization''s data using common labels: private, sensitive, public, and proprietary. Which of the following should he apply to his highest classification level based on common industry practices?',
  '["Private", "Sensitive", "Public", "Proprietary"]'::jsonb,
  3,
  'Common practice makes proprietary or confidential data the most sensitive data. Private data is internal business data that shouldn''t be exposed but that doesn''t meet the threshold for confidential or proprietary data. Sensitive data may help attackers or otherwise create risk and typically refers to any information that isn''t public or unclassified, and public data is just that—data that is or can be made public.',
  '["Data Classification", "Information Security"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'The government defense contractor that Selah works for has recently shut down a major research project and is planning on reusing the hundreds of thousands of dollars of systems and data storage tapes used for the project for other purposes. When Selah reviews the company''s internal processes, she finds that she can''t reuse the tapes and that the manual says they should be destroyed. Why isn''t Selah allowed to degauss and then reuse the tapes to save her employer money?',
  '["Data permanence may be an issue.", "Data remanence is a concern.", "The tapes may suffer from bitrot.", "Data from tapes can''t be erased by degaussing."]'::jsonb,
  1,
  'Many organizations require the destruction of media that contains data at higher levels of classification. Often the cost of the media is lower than the potential costs of data exposure, and it is difficult to guarantee that reused media doesn''t contain remnant data. Tapes can be erased by degaussing, but degaussing is not always fully effective. Bitrot describes the slow loss of data on aging media, while data permanence is a term sometimes used to describe the life span of data and media.',
  '["Data Remanence", "Data Sanitization", "Media Reuse", "Classification"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Which of the following information security risks to data at rest would result in the greatest reputational impact on an organization?',
  '["Improper classification", "Data breach", "Decryption", "An intentional insider threat"]'::jsonb,
  1,
  'Typically, data breaches cause the greatest reputational damage as a result of threats to data at rest. Data at rest with a high level of sensitivity is often encrypted to help prevent this. Decryption is not as significant of a threat if strong encryption is used and encryption keys are well secured. Insider threats are a risk, but the majority of insider threat issues are unintentional rather than intentional, making this risk less likely in most organizations.',
  '["Data Breach", "Reputational Risk", "Data at Rest"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Fred''s organization allows downgrading of systems for reuse after projects have been finished and the systems have been purged. What concern should Fred raise about the reuse of the systems from his Top Secret classified project for a future project classified as Secret?',
  '["The Top Secret data may be commingled with the Secret data, resulting in a need to relabel the system.", "The cost of the sanitization process may exceed the cost of new equipment.", "The data may be exposed as part of the sanitization process.", "The organization''s DLP system may flag the new system due to the difference in data labels."]'::jsonb,
  1,
  'Downgrading systems and media is rare due to the difficulty of ensuring that sanitization is complete. The need to completely wipe (or destroy) the media that systems use means that the cost of reuse is often significant and may exceed the cost of purchasing a new system or media. The goal of purging is to ensure that no data remains, so commingling data should not be a concern, nor should the exposure of the data; only staff with the proper clearance should handle the systems! Finally, a DLP system should flag data based on labels, not on the system it comes from.',
  '["Data Sanitization", "Classification", "Cost-Benefit Analysis", "Media Reuse"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Which of the following concerns should not be part of the decision when classifying data?',
  '["The cost to classify the data", "The sensitivity of the data", "The amount of harm that exposure of the data could cause", "The value of the data to the organization"]'::jsonb,
  0,
  'Classification should be conducted based on the value of the data to the organization, its sensitivity, and the amount of harm that could result from exposure of the data. Cost should be considered when implementing controls and is weighed against the damage that exposure would create.',
  '["Data Classification", "Risk Assessment", "Information Security"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Jacob''s organization uses the U.S. government''s data classification system, which includes Top Secret, Secret, Confidential, and Unclassified ratings (from most sensitive to least). Jacob encounters a system that contains Secret, Confidential, and Top Secret data. How should it be classified?',
  '["Top Secret", "Confidential", "Secret", "Mixed classification"]'::jsonb,
  0,
  'When data is stored in a mixed classification environment, it is typically classified based on the highest classification of data included. In this case, the U.S. government''s highest classification is Top Secret. Mixed classification is not a valid classification in this scheme.',
  '["Data Classification", "Government Classification"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Ben is following the National Institute of Standards and Technology (NIST) Special Publication 800-88 guidelines for sanitization and disposition. He is handling information that his organization classified as sensitive, which is a moderate security categorization in the NIST model. If the media is going to be sold as surplus, what process does Ben need to follow?',
  '["Destroy, validate, document", "Clear, purge, document", "Purge, document, validate", "Purge, validate, document"]'::jsonb,
  3,
  'The NIST SP 800-88 process for sanitization and disposition shows that media that will be reused and was classified at a moderate level should be purged and then that purge should be validated. Finally, it should be documented.',
  '["Data Sanitization", "NIST", "Media Disposal", "Classification"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'What methods are often used to protect data in transit?',
  '["Telnet, ISDN, UDP", "BitLocker, FileVault", "AES, Serpent, IDEA", "TLS, VPN, IPsec"]'::jsonb,
  3,
  'Data in transit is data that is traversing a network or is otherwise in motion. TLS, VPNs, and IPsec tunnels are all techniques used to protect data in transit. AES, Serpent, and IDEA are all symmetric algorithms, while Telnet, ISDN, and UDP are all protocols. BitLocker and FileVault are both used to encrypt data, but they protect only stored data, not data in transit.',
  '["Data in Transit", "Encryption", "Network Security", "TLS", "VPN", "IPsec"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Shandra wants to secure an encryption key. Which location would be the most difficult to protect, if the key was kept and used in that location?',
  '["On a local network", "On disk", "In memory", "On a public network"]'::jsonb,
  2,
  'The most difficult location to secure for encryption keys and similar highly sensitive information is in active memory because the data needs to be decrypted to be used. When data is at rest on a drive or in transit via either a local or public network, it can be encrypted until it reaches its destination, and you can use strong encryption in each of those circumstances.',
  '["Key Management", "Encryption", "Memory Security"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'If Chris''s company operates in the European Union and has been contracted to handle the data for a third party, what role is his company operating in when it uses this process to classify and handle data?',
  '["Business owners", "Mission owners", "Data processors", "Data administrators"]'::jsonb,
  2,
  'Third-party organizations that process personal data on behalf of a data controller are known as data processors. The organization that they are contracting with would act in the role of the business or mission owners, and others within Chris''s organization would have the role of data administrators, granting access as needed to the data based on their operational procedures and data classification.',
  '["GDPR", "Data Roles", "Data Processor", "Third-Party Risk"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Eric has been tasked with identifying intangible assets but needs to provide his team with a list of the assets they will be inventorying. Which of the following is not an example of an intangible asset?',
  '["Patents", "Databases", "Formulas", "Employees"]'::jsonb,
  3,
  'Patents, databases, and formulas are all examples of intangible assets. Tangible assets include things like hardware, cables, and buildings. Personnel assets include employees, and most organizations would be quite concerned if their employees were intangible!',
  '["Asset Classification", "Intangible Assets", "Tangible Assets"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'What issue is the validation portion of the NIST SP 800-88 sample certificate of sanitization intended to help prevent?',
  '["Destruction", "Reuse", "Data remanence", "Attribution"]'::jsonb,
  2,
  'Validation processes are conducted to ensure that the sanitization process was completed, avoiding data remanence. A form like this one helps to ensure that each device has been checked and that it was properly wiped, purged, or sanitized. This can allow reuse, does not prevent destruction, and does not help with attribution, which is a concept used with encryption to prove who created or sent a file.',
  '["Data Sanitization", "NIST", "Data Remanence", "Compliance"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'Why is declassification rarely chosen as an option for media reuse?',
  '["Purging is sufficient for sensitive data.", "Sanitization is the preferred method of data removal.", "It is more expensive than new media and may still fail.", "Clearing is required first."]'::jsonb,
  2,
  'Ensuring that data cannot be recovered is difficult, and the time and effort required to securely and completely wipe media as part of declassification can exceed the cost of new media. Sanitization, purging, and clearing may be part of declassification, but they are not reasons that it is not frequently chosen as an option for organizations with data security concerns.',
  '["Data Sanitization", "Media Reuse", "Cost-Benefit Analysis"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'What is the best method to sanitize a solid-state drive (SSD)?',
  '["Degaussing", "Cryptographic erasure", "Physical destruction", "Overwriting with random data"]'::jsonb,
  2,
  'Physical destruction is the most reliable method for sanitizing SSDs because of their complex internal architecture and wear leveling algorithms. SSDs cannot be degaussed since they don''t use magnetic storage. Cryptographic erasure can be effective if the entire drive was encrypted, but physical destruction provides the highest assurance. Overwriting with random data may not reach all areas of an SSD due to wear leveling and over-provisioning.',
  '["SSD", "Data Sanitization", "Physical Destruction", "Storage Security"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'What type of attack involves manipulating the supply chain to insert malicious hardware or software before it reaches the end user?',
  '["Social engineering", "Supply chain attack", "Insider threat", "Advanced persistent threat"]'::jsonb,
  1,
  'A supply chain attack specifically targets the supply chain process to insert malicious components, software, or modifications before the product reaches the end user. This can involve compromising manufacturers, distributors, or any point in the supply chain. While this could be part of an advanced persistent threat campaign, the specific manipulation of the supply chain process makes this a supply chain attack.',
  '["Supply Chain Security", "Hardware Security", "Third-Party Risk"]'::jsonb,
  null,
  true
),

(
  'Asset Security',
  'Hard',
  'When implementing data loss prevention (DLP) controls, which approach provides the most comprehensive protection?',
  '["Network-based DLP only", "Endpoint-based DLP only", "Storage-based DLP only", "A combination of network, endpoint, and storage-based DLP"]'::jsonb,
  3,
  'A comprehensive DLP strategy requires protection at multiple points: network-based DLP monitors data in motion, endpoint-based DLP protects data in use, and storage-based DLP secures data at rest. Using only one approach leaves gaps in coverage. For example, network-based DLP alone cannot protect against data theft via removable media, while endpoint-based DLP alone cannot monitor network communications.',
  '["Data Loss Prevention", "DLP", "Data Protection", "Defense in Depth"]'::jsonb,
  null,
  true
);