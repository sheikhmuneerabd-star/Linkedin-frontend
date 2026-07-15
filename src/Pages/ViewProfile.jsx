import React, { useContext, useEffect, useState } from 'react'
import Nav from '../Components/Nav'
import { AiOutlineCamera } from "react-icons/ai";
import empty_profile from '../assets/empty_profile.png'
import { FaPlus } from "react-icons/fa6";
import { userDataContext } from '../Context/UserContext';
import { GoPencil } from "react-icons/go";
import EditProfile from '../Components/EditProfile';
import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineSparkles } from "react-icons/hi2";
import axios from 'axios';
import { authData } from '../Context/AuthContext';
import Post from '../Components/Post';
import ConnectionButton from '../Components/ConnectionButton';

function ViewProfile() {
    const { userData, setUserData, edit, setEdit, postData, setPostData, profileData, setProfileData } = useContext(userDataContext);
    const { serverUrl } = useContext(authData);

    const [profilePost, setProfilePost] = useState([]);
    useEffect(() => {
        setProfilePost(postData.filter((post) => post.author._id == profileData._id));
    }, [profileData]);

    const isOwnProfile = profileData._id == userData._id;

    return (
        <div className='w-full min-h-screen bg-[#f4f2ee] pb-16 md:pb-0'>
            {edit && <EditProfile />}
            <Nav />
            <div className='w-full max-w-[700px] mx-auto mt-5 px-4 pb-10'>

                {/* Profile header card */}
                <div className='w-full bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden'>
                    <div className='bg-gradient-to-r from-[#0a66c2]/20 to-[#0a66c2]/5 w-full h-[100px] relative cursor-pointer group' onClick={() => isOwnProfile && setEdit(true)}>
                        {profileData.coverImage && <img src={profileData.coverImage} alt="" className='w-full h-full object-cover' />}
                        {isOwnProfile &&
                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                                <AiOutlineCamera className='text-xl text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                            </div>
                        }
                    </div>

                    <div className='px-5 pb-5'>
                        <div className='-mt-9 relative w-fit'>
                            <div className='rounded-full w-[76px] h-[76px] overflow-hidden cursor-pointer ring-4 ring-white bg-gray-100' onClick={() => isOwnProfile && setEdit(true)}>
                                <img src={profileData.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                            </div>
                            {isOwnProfile &&
                                <div className='w-5 h-5 flex justify-center items-center absolute bottom-0 right-0 rounded-full bg-[#0a66c2] ring-2 ring-white cursor-pointer' onClick={() => setEdit(true)}>
                                    <FaPlus className='text-[10px] text-white' />
                                </div>
                            }
                        </div>

                        <h1 className='font-bold text-[22px] text-gray-900 mt-2 leading-tight'>{profileData.firstName} {profileData.lastName}</h1>
                        <p className='font-medium text-[15px] text-gray-700 mt-1'>{profileData.headline}</p>
                        <p className='text-[13px] text-gray-500 mt-1'>{profileData.location}</p>
                        <p className='text-[13px] font-semibold text-[#0a66c2] mt-1'>{profileData.connection.length} connection{profileData.connection.length !== 1 ? "s" : ""}</p>

                        {isOwnProfile ? (
                            <button
                                className='mt-3 border border-[#0a66c2] rounded-full flex gap-2 items-center justify-center w-full max-w-[170px] h-[38px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
                                onClick={() => setEdit(true)}
                            >
                                Edit Profile <GoPencil size={14} />
                            </button>
                        ) : (
                            <div className='mt-3'>
                                <ConnectionButton userId={profileData._id} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Posts */}
                <div className='w-full bg-white shadow-sm border border-gray-200 rounded-xl p-4 mt-4'>
                    <h2 className='text-lg font-semibold text-gray-900'>Posts ({profilePost.length})</h2>
                </div>

                {profilePost.length > 0 &&
                    <div className='space-y-4 mt-4'>
                        {profilePost.map((post, index) => (
                            <Post key={post._id || index} id={post._id} description={post.description} author={post.author} image={post.image} like={post.like} comment={post.comment} createdAt={post.createdAt} />
                        ))}
                    </div>
                }

                {/* Skills */}
                {(profileData.skills.length > 0 || isOwnProfile) &&
                    <div className='w-full bg-white shadow-sm border border-gray-200 rounded-xl p-4 mt-4'>
                        <div className='flex items-center gap-2 mb-3'>
                            <HiOutlineSparkles className='text-[#0a66c2] text-lg' />
                            <h2 className='text-lg font-semibold text-gray-900'>Skills</h2>
                        </div>

                        {profileData.skills.length > 0 &&
                            <div className='flex flex-wrap gap-2 mb-1'>
                                {profileData.skills.map((skill, index) => (
                                    <span key={index} className='bg-[#0a66c2]/10 text-[#0a66c2] rounded-full px-3 py-1.5 text-[13px] font-medium'>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        }
                        {isOwnProfile &&
                            <button
                                className='mt-3 border border-[#0a66c2] rounded-full flex gap-2 items-center justify-center w-full max-w-[150px] h-[36px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
                                onClick={() => setEdit(true)}
                            >
                                Add Skills
                            </button>
                        }
                    </div>
                }

                {/* Education */}
                {(profileData.education.length > 0 || isOwnProfile) &&
                    <div className='w-full bg-white shadow-sm border border-gray-200 rounded-xl p-4 mt-4'>
                        <div className='flex items-center gap-2 mb-3'>
                            <HiOutlineAcademicCap className='text-[#0a66c2] text-lg' />
                            <h2 className='text-lg font-semibold text-gray-900'>Education</h2>
                        </div>

                        {profileData.education.length > 0 &&
                            <div className='space-y-3 mb-1'>
                                {profileData.education.map((edu, index) => (
                                    <div key={index} className='border-b border-gray-100 last:border-none pb-3 last:pb-0'>
                                        <p className='font-semibold text-gray-900 text-[15px]'>{edu.college}</p>
                                        <p className='text-gray-600 text-[14px]'>{edu.degree} · {edu.fieldOfStudy}</p>
                                    </div>
                                ))}
                            </div>
                        }
                        {isOwnProfile &&
                            <button
                                className='mt-2 border border-[#0a66c2] rounded-full flex gap-2 items-center justify-center w-full max-w-[170px] h-[36px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
                                onClick={() => setEdit(true)}
                            >
                                Add Education
                            </button>
                        }
                    </div>
                }

                {/* Experience */}
                {(profileData.experience.length > 0 || isOwnProfile) &&
                    <div className='w-full bg-white shadow-sm border border-gray-200 rounded-xl p-4 mt-4'>
                        <div className='flex items-center gap-2 mb-3'>
                            <HiOutlineBriefcase className='text-[#0a66c2] text-lg' />
                            <h2 className='text-lg font-semibold text-gray-900'>Experience</h2>
                        </div>

                        {profileData.experience.length > 0 &&
                            <div className='space-y-3 mb-1'>
                                {profileData.experience.map((exp, index) => (
                                    <div key={index} className='border-b border-gray-100 last:border-none pb-3 last:pb-0'>
                                        <p className='font-semibold text-gray-900 text-[15px]'>{exp.title} · {exp.company}</p>
                                        <p className='text-gray-600 text-[14px] mt-0.5'>{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        }
                        {isOwnProfile &&
                            <button
                                className='mt-2 border border-[#0a66c2] rounded-full flex gap-2 items-center justify-center w-full max-w-[170px] h-[36px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
                                onClick={() => setEdit(true)}
                            >
                                Add Experience
                            </button>
                        }
                    </div>
                }
            </div>
        </div>
    )
}

export default ViewProfile