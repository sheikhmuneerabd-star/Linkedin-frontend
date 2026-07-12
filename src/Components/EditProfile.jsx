import React, { useContext, useRef, useState } from 'react'
import { RxCross2 } from "react-icons/rx";
import { userDataContext } from '../Context/UserContext';
import { AiOutlineCamera } from "react-icons/ai";
import { FaPlus } from "react-icons/fa6";
import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineSparkles } from "react-icons/hi2";
import empty_profile from '../assets/empty_profile.png'
import axios from 'axios';
import { authData } from '../Context/AuthContext';

function EditProfile() {
    const { userData, setUserData, edit, setEdit } = useContext(userDataContext);
    const { serverUrl } = useContext(authData);

    const [firstName, setFirstName] = useState(userData.firstName || "");
    const [lastName, setLastName] = useState(userData.lastName || "");
    const [userName, setUserName] = useState(userData.userName || "");
    const [headline, setHeadline] = useState(userData.headline || "");
    const [location, setLocation] = useState(userData.location || "");
    const [gender, setGender] = useState(userData.gender || "");
    const [skills, setSkills] = useState(userData.skills || []);
    const [newSkill, setNewSkill] = useState("");
    const [education, setEducations] = useState(userData.education || []);
    const [newEducation, setNewEducation] = useState({
        college: "",
        degree: "",
        fieldOfStudy: ""
    });
    const [experience, setExperience] = useState(userData.experience || []);
    const [newExperience, setNewExperience] = useState({
        title: "",
        company: "",
        description: ""
    });

    const [frontendProfileImage, setFrontendProfileImage] = useState(userData.profileImage || empty_profile);
    const [backendProfileImage, setBackendProfileImage] = useState(null);

    const [frontendCoverImage, setFrontendCoverImage] = useState(userData.coverImage || null);
    const [backendCoverImage, setBackendCoverImage] = useState(null);

    const [saving, setSaving] = useState(false);

    const addSkills = (e) => {
        e.preventDefault();
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill]);
            setNewSkill("");
        }
    }

    const removeSkill = (skill) => {
        if (skills.includes(skill)) {
            setSkills(skills.filter((s) => s !== skill));
        }
    }

    const addEducation = (e) => {
        e.preventDefault();
        if (newEducation.college && newEducation.degree && newEducation.fieldOfStudy) {
            setEducations([...education, newEducation]);
            setNewEducation({
                college: "",
                degree: "",
                fieldOfStudy: ""
            });
        }
    }

    const removeEducation = (edu) => {
        if (education.includes(edu)) {
            setEducations(education.filter((e) => e !== edu));
        }
    }

    const addExperience = (e) => {
        e.preventDefault();
        if (newExperience.title && newExperience.company && newExperience.description) {
            setExperience([...experience, newExperience]);
            setNewExperience({
                title: "",
                company: "",
                description: ""
            });
        }
    }

    const removeExperience = (exp) => {
        if (experience.includes(exp)) {
            setExperience(experience.filter((e) => e !== exp));
        }
    }

    const profileImage = useRef();
    const coverImage = useRef();

    const handleProfileImage = (e) => {
        let file = e.target.files[0];
        if (!file) return;
        setBackendProfileImage(file);
        setFrontendProfileImage(URL.createObjectURL(file));
    }
    const handleCoverImage = (e) => {
        let file = e.target.files[0];
        if (!file) return;
        setBackendCoverImage(file);
        setFrontendCoverImage(URL.createObjectURL(file));
    }

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            let formData = new FormData();
            formData.append("firstName", firstName)
            formData.append("lastName", lastName)
            formData.append("userName", userName)
            formData.append("headline", headline)
            formData.append("location", location)
            formData.append("gender", gender)
            formData.append("skills", JSON.stringify(skills))
            formData.append("newSkill", newSkill)
            formData.append("education", JSON.stringify(education))
            formData.append("experience", JSON.stringify(experience))

            if (backendProfileImage) {
                formData.append("profileImage", backendProfileImage)
            }
            if (backendCoverImage) {
                formData.append("coverImage", backendCoverImage)
            }

            let result = await axios.put(serverUrl + "/api/user/updateProfile", formData, { withCredentials: true });
            setUserData(result.data);
            setSaving(false);
            setEdit(false);
        } catch (error) {
            setSaving(false);
            console.log("handle save profile: ", error);
        }
    }

    // Reusable input styling
    const inputClass = 'w-full h-[44px] px-3 outline-none border border-gray-300 rounded-lg text-[15px] transition-all focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20';
    const sectionClass = 'border border-gray-200 rounded-xl p-4';

    return (
        <div className='fixed top-0 left-0 w-full h-[100vh] z-[100] flex justify-center items-center px-3'>
            <div className='w-full h-full absolute bg-black/50' onClick={() => setEdit(false)}></div>

            <div className='bg-white w-full max-w-[560px] max-h-[88vh] absolute z-[200] rounded-2xl shadow-2xl overflow-hidden flex flex-col'>

                {/* Sticky header */}
                <div className='flex justify-between items-center px-5 py-4 border-b border-gray-200 shrink-0'>
                    <h2 className='text-lg font-bold text-gray-900'>Edit profile</h2>
                    <RxCross2
                        className='text-[22px] cursor-pointer text-gray-500 hover:text-gray-900 hover:rotate-90 transition-all duration-200'
                        onClick={() => setEdit(false)}
                    />
                </div>

                {/* Scrollable body */}
                <div className='overflow-y-auto flex-1'>
                    <div className='w-full relative'>
                        <input type="file" hidden accept='image/*' ref={profileImage} onChange={handleProfileImage} />
                        <input type="file" hidden accept='image/*' ref={coverImage} onChange={handleCoverImage} />

                        <div
                            className='bg-gradient-to-r from-[#0a66c2]/25 to-[#0a66c2]/10 w-full h-[120px] overflow-hidden relative cursor-pointer group'
                            onClick={() => coverImage.current.click()}
                        >
                            {frontendCoverImage && <img src={frontendCoverImage} alt="" className='w-full h-full object-cover' />}
                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                                <div className='opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-white'>
                                    <AiOutlineCamera className='text-2xl' />
                                    <span className='text-xs font-medium mt-1'>Change cover</span>
                                </div>
                            </div>
                        </div>

                        <div className='absolute top-[80px] left-5 rounded-full w-[76px] h-[76px] overflow-hidden cursor-pointer ring-4 ring-white bg-gray-100 group' onClick={() => profileImage.current.click()}>
                            <img src={frontendProfileImage} alt="" className='w-full h-full object-cover' />
                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center'>
                                <AiOutlineCamera className='text-lg text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                            </div>
                        </div>
                        <div className='w-6 h-6 flex justify-center items-center absolute top-[128px] left-[80px] rounded-full bg-[#0a66c2] ring-2 ring-white'>
                            <FaPlus className='text-[11px] text-white' />
                        </div>
                    </div>

                    <div className='px-5 pt-12 pb-5 space-y-5'>

                        {/* Basic info */}
                        <div className='grid grid-cols-2 gap-3'>
                            <input className={inputClass} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder='First name' />
                            <input className={inputClass} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder='Last name' />
                        </div>
                        <input className={inputClass} type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='Username' />
                        <input className={inputClass} type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder='Headline (e.g. Frontend Developer at Acme)' />
                        <div className='grid grid-cols-2 gap-3'>
                            <input className={inputClass} type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder='Location' />
                            <select className={inputClass + ' bg-white text-gray-700'} value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="">Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Skills */}
                        <div className={sectionClass}>
                            <div className='flex items-center gap-2 mb-3'>
                                <HiOutlineSparkles className='text-[#0a66c2] text-lg' />
                                <h1 className='text-[15px] font-semibold text-gray-900'>Skills</h1>
                            </div>

                            {skills.length > 0 &&
                                <div className='flex flex-wrap gap-2 mb-3'>
                                    {skills.map((skill, index) => (
                                        <div key={index} className='bg-[#0a66c2]/10 text-[#0a66c2] rounded-full pl-3 pr-2 py-1 flex items-center gap-1.5 text-[13px] font-medium'>
                                            <span>{skill}</span>
                                            <RxCross2 className='text-[15px] cursor-pointer hover:text-red-600' onClick={() => removeSkill(skill)} />
                                        </div>
                                    ))}
                                </div>
                            }
                            <form className='flex gap-2' onSubmit={addSkills}>
                                <input className={inputClass + ' h-[40px]'} type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder='Add a skill (e.g. React.js)' />
                                <button className='shrink-0 px-4 h-[40px] rounded-lg bg-[#0a66c2] text-white font-semibold text-sm hover:bg-[#004182] transition-colors'>
                                    Add
                                </button>
                            </form>
                        </div>

                        {/* Education */}
                        <div className={sectionClass}>
                            <div className='flex items-center gap-2 mb-3'>
                                <HiOutlineAcademicCap className='text-[#0a66c2] text-lg' />
                                <h1 className='text-[15px] font-semibold text-gray-900'>Education</h1>
                            </div>

                            {education.length > 0 &&
                                <div className='space-y-2 mb-3'>
                                    {education.map((edu, index) => (
                                        <div key={index} className='bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start gap-2'>
                                            <div className='text-[13px] text-gray-700 leading-relaxed'>
                                                <p className='font-semibold text-gray-900 text-[14px]'>{edu.college}</p>
                                                <p>{edu.degree} · {edu.fieldOfStudy}</p>
                                            </div>
                                            <RxCross2 className='text-[17px] cursor-pointer text-gray-400 hover:text-red-600 shrink-0 mt-0.5' onClick={() => removeEducation(edu)} />
                                        </div>
                                    ))}
                                </div>
                            }
                            <form className='space-y-2' onSubmit={addEducation}>
                                <input className={inputClass + ' h-[40px]'} type="text" value={newEducation.college} onChange={(e) => setNewEducation({ ...newEducation, college: e.target.value })} placeholder='College / University' />
                                <div className='grid grid-cols-2 gap-2'>
                                    <input className={inputClass + ' h-[40px]'} type="text" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })} placeholder='Degree' />
                                    <input className={inputClass + ' h-[40px]'} type="text" value={newEducation.fieldOfStudy} onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })} placeholder='Field of study' />
                                </div>
                                <button className='w-full h-[38px] rounded-lg border border-[#0a66c2] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'>
                                    Add education
                                </button>
                            </form>
                        </div>

                        {/* Experience */}
                        <div className={sectionClass}>
                            <div className='flex items-center gap-2 mb-3'>
                                <HiOutlineBriefcase className='text-[#0a66c2] text-lg' />
                                <h1 className='text-[15px] font-semibold text-gray-900'>Experience</h1>
                            </div>

                            {experience.length > 0 &&
                                <div className='space-y-2 mb-3'>
                                    {experience.map((exp, index) => (
                                        <div key={index} className='bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start gap-2'>
                                            <div className='text-[13px] text-gray-700 leading-relaxed'>
                                                <p className='font-semibold text-gray-900 text-[14px]'>{exp.title} · {exp.company}</p>
                                                <p>{exp.description}</p>
                                            </div>
                                            <RxCross2 className='text-[17px] cursor-pointer text-gray-400 hover:text-red-600 shrink-0 mt-0.5' onClick={() => removeExperience(exp)} />
                                        </div>
                                    ))}
                                </div>
                            }
                            <form className='space-y-2' onSubmit={addExperience}>
                                <div className='grid grid-cols-2 gap-2'>
                                    <input className={inputClass + ' h-[40px]'} type="text" value={newExperience.title} onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} placeholder='Job title' />
                                    <input className={inputClass + ' h-[40px]'} type="text" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} placeholder='Company' />
                                </div>
                                <textarea className={inputClass + ' h-[70px] pt-2 resize-none'} value={newExperience.description} onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} placeholder='Description' />
                                <button className='w-full h-[38px] rounded-lg border border-[#0a66c2] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'>
                                    Add experience
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Sticky footer */}
                <div className='px-5 py-4 border-t border-gray-200 shrink-0'>
                    <button
                        className='bg-[#0a66c2] w-full h-[46px] rounded-full text-white font-semibold text-[16px] hover:bg-[#004182] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                        disabled={saving}
                        onClick={handleSaveProfile}
                    >
                        {saving && <span className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin'></span>}
                        {saving ? "Saving..." : "Save profile"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditProfile