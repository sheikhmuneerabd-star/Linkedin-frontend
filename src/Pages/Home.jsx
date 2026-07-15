import React, { useContext, useEffect, useRef, useState } from 'react'
import Nav from '../Components/Nav'
import { AiOutlineCamera } from "react-icons/ai";
import empty_profile from '../assets/empty_profile.png';
import { FaPlus } from "react-icons/fa6";
import { userDataContext } from '../Context/UserContext';
import { GoPencil } from "react-icons/go";
import EditProfile from '../Components/EditProfile';
import { RxCross2 } from "react-icons/rx";
import { FaRegImage } from "react-icons/fa6";
import axios from 'axios';
import { authData } from '../Context/AuthContext';
import Post from '../Components/Post';
import ConnectionButton from '../Components/ConnectionButton';

function Home() {
  const { userData, setUserData, edit, setEdit, postData, setPostData, handleGetProfile, getPost } = useContext(userDataContext);
  const { serverUrl } = useContext(authData);

  const [uploadPost, setUploadPost] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const image = useRef();
  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState("");
  const [description, setDescription] = useState("");

  const handleImage = (e) => {
    let file = e.target.files[0];
    if (!file) return;
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  }

  const handlePost = async () => {
    if (!description.trim() && !backendImage) return;
    try {
      setPostLoading(true);
      const formData = new FormData();
      formData.append("description", description);
      if (backendImage) {
        formData.append("image", backendImage);
      }
      await axios.post(serverUrl + "/api/post/create", formData, { withCredentials: true });
      // no need to refetch here — the server broadcasts the new post over
      // the socket ("newPost"), which UserContext listens for and prepends
      // to postData automatically for every connected user, including us.
      setPostLoading(false);
      setUploadPost(false);
      setDescription("");
      setFrontendImage("");
      setBackendImage("");
    } catch (error) {
      setPostLoading(false);
      console.log("handlePost Error: ", error);
    }
  }

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const handleSuggestedUser = async () => {
    try {
      setSuggestedLoading(true);
      const res = await axios.get(serverUrl + "/api/user/suggestedUsers", { withCredentials: true });
      setSuggestedUsers(res.data);
    } catch (error) {
      console.log("handleSuggestedUser Error: ", error);
    } finally {
      setSuggestedLoading(false);
    }
  }

  useEffect(() => {
    handleSuggestedUser();
  }, []);

  return (
    <div className='w-full min-h-screen bg-[#f4f2ee] pb-16 md:pb-0'>
      {edit && <EditProfile />}
      <Nav />
      <div className='max-w-[1128px] mx-auto mt-5 flex lg:flex-row flex-col px-4 gap-5 pb-10'>

        {/* Left profile card */}
        <div className='w-full lg:w-[24%] lg:sticky lg:top-[76px] h-fit shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden'>
          <div className='bg-gradient-to-r from-[#0a66c2]/20 to-[#0a66c2]/5 w-full h-[80px] relative cursor-pointer group' onClick={() => setEdit(true)}>
            {userData.coverImage && <img src={userData.coverImage} alt="" className='w-full h-full object-cover' />}
            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
              <AiOutlineCamera className='text-xl text-white opacity-0 group-hover:opacity-100 transition-opacity' />
            </div>
          </div>
          <div className='px-4 pb-4'>
            <div className='-mt-8 mb-2 relative w-fit'>
              <div className='rounded-full w-[64px] h-[64px] overflow-hidden cursor-pointer ring-4 ring-white bg-gray-100' onClick={() => setEdit(true)}>
                <img src={userData.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
              </div>
              <div className='w-5 h-5 flex justify-center items-center absolute bottom-0 right-0 rounded-full bg-[#0a66c2] ring-2 ring-white cursor-pointer' onClick={() => setEdit(true)}>
                <FaPlus className='text-[10px] text-white' />
              </div>
            </div>
            <h1 className='font-semibold text-[18px] text-gray-900 leading-tight'>{userData.firstName} {userData.lastName}</h1>
            <p className='font-medium text-[13px] text-gray-600 mt-0.5'>{userData.headline}</p>
            <p className='text-[12px] text-gray-500 mt-0.5'>{userData.location}</p>

            <button
              className='mt-3 border border-[#0a66c2] rounded-full flex gap-2 items-center justify-center w-full h-[36px] text-[#0a66c2] font-semibold text-sm hover:bg-[#0a66c2]/5 transition-colors'
              onClick={() => setEdit(true)}
            >
              Edit Profile <GoPencil size={14} />
            </button>
          </div>
        </div>

        {/* Center feed */}
        <div className='w-full lg:w-[52%] flex flex-col gap-4'>
          <div className='w-full bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-3'>
            <div className='rounded-full w-[48px] h-[48px] shrink-0 overflow-hidden cursor-pointer bg-gray-100' onClick={() => setEdit(true)}>
              <img src={userData.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
            </div>
            <button
              className='flex-1 rounded-full h-[44px] flex items-center pl-4 text-left text-gray-500 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors'
              onClick={() => setUploadPost(true)}
            >
              Start a post...
            </button>
          </div>

          {postData.length === 0 ? (
            <div className='w-full bg-white rounded-xl shadow-sm border border-gray-200 p-10 flex flex-col items-center text-center'>
              <h2 className='text-lg font-semibold text-gray-800'>No posts yet</h2>
              <p className='text-gray-500 text-sm mt-1'>Be the first to share something with your network.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {postData.map((post, index) => (
                <Post key={post._id || index} id={post._id} description={post.description} author={post.author} image={post.image} like={post.like} comment={post.comment} createdAt={post.createdAt} />
              ))}
            </div>
          )}
        </div>

        {/* Right suggestions */}
        <div className='w-full lg:w-[24%] lg:sticky lg:top-[76px] h-fit bg-white rounded-xl shadow-sm border border-gray-200 p-3'>
          <div className='flex items-center justify-between px-1 pb-2 border-b border-gray-200'>
            <h1 className='text-[16px] font-semibold text-gray-900'>People you may know</h1>
          </div>
          <div className='space-y-1 mt-2'>
            {suggestedLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className='flex items-center gap-3 p-1.5 animate-pulse'>
                  <div className='rounded-full w-[48px] h-[48px] bg-gray-200'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                    <div className='h-2.5 bg-gray-200 rounded w-1/2'></div>
                  </div>
                </div>
              ))
            ) : suggestedUsers.length === 0 ? (
              <div className='flex flex-col items-center text-center py-6 px-2'>
                <p className='text-gray-500 text-sm'>No suggestions right now.</p>
                <p className='text-gray-400 text-xs mt-0.5'>Check back later for new people to connect with.</p>
              </div>
            ) : (
              suggestedUsers.map((su) => (
                <div key={su._id || su.userName} className='group flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 transition-colors'>
                  <div
                    className='rounded-full w-[48px] h-[48px] shrink-0 overflow-hidden bg-gray-100 cursor-pointer ring-2 ring-transparent group-hover:ring-[#0a66c2]/20 transition-all'
                    onClick={() => handleGetProfile(su.userName)}
                  >
                    <img src={su.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                  </div>
                  <div className='min-w-0 flex-1 cursor-pointer' onClick={() => handleGetProfile(su.userName)}>
                    <h1 className='font-semibold text-[14px] text-gray-900 truncate'>{su.firstName} {su.lastName}</h1>
                    <p className='font-medium text-[12px] text-gray-500 truncate'>{su.headline}</p>
                  </div>
                  <div className='shrink-0'>
                    <ConnectionButton userId={su._id} compact />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create post modal */}
      {uploadPost &&
        <div className='fixed top-0 left-0 w-full h-[100vh] z-[100] flex justify-center items-center px-4'>
          <div className='absolute top-0 left-0 w-full h-[100vh] bg-black/50' onClick={() => setUploadPost(false)}></div>
          <div className='relative bg-white w-full max-w-[500px] max-h-[85vh] overflow-y-auto z-[200] rounded-xl shadow-2xl'>
            <div className='flex justify-between items-center p-4 border-b border-gray-200'>
              <div className='flex items-center gap-2'>
                <div className='rounded-full w-[44px] h-[44px] overflow-hidden bg-gray-100'>
                  <img src={userData.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                </div>
                <span className='font-semibold text-[16px] text-gray-900'>{userData.firstName} {userData.lastName}</span>
              </div>
              <RxCross2 className='text-[24px] cursor-pointer text-gray-500 hover:text-gray-800 transition-colors' onClick={() => setUploadPost(false)} />
            </div>

            <div className='p-4'>
              <textarea
                className='text-[17px] outline-none w-full h-[120px] resize-none placeholder:text-gray-400'
                placeholder='What do you want to talk about...?'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              {frontendImage &&
                <div className='w-full rounded-lg overflow-hidden relative border border-gray-200'>
                  <RxCross2
                    className='absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-2xl cursor-pointer z-10'
                    onClick={() => { setFrontendImage(""); setBackendImage(""); }}
                  />
                  <img className='w-full max-h-[300px] object-cover' src={frontendImage} alt="" />
                </div>
              }
            </div>

            <input type="file" hidden ref={image} accept="image/*" onChange={handleImage} />

            <div className='px-4 pb-2 flex items-center justify-between border-t border-gray-100 pt-3'>
              <FaRegImage
                className='text-2xl text-gray-500 hover:text-[#0a66c2] cursor-pointer transition-colors'
                onClick={() => image.current.click()}
              />
              <button
                className='bg-[#0a66c2] px-6 h-[38px] rounded-full text-white font-semibold text-[15px] hover:bg-[#004182] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                onClick={handlePost}
                disabled={postLoading || (!description.trim() && !backendImage)}
              >
                {postLoading && <span className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin'></span>}
                {postLoading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default Home