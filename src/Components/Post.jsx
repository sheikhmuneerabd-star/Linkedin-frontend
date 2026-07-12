import { useContext, useEffect, useState } from 'react'
import empty_profile from '../assets/empty_profile.png'
import moment from 'moment'
import { AiOutlineLike } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { FaRegCommentDots } from "react-icons/fa";
import axios from 'axios';
import { authData } from '../Context/AuthContext';
import { socket, userDataContext } from '../Context/UserContext';
import { IoMdSend } from "react-icons/io";
import ConnectionButton from './ConnectionButton';

function Post({ id, description, author, image, like, comment, createdAt }) {
  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authData);
  const { getPost, userData, handleGetProfile } = useContext(userDataContext);

  const [likes, setLikes] = useState([]);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const handleLike = async () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    try {
      let res = await axios.get(serverUrl + `/api/post/like/${id}`, { withCredentials: true });
      setLikes(res.data.like);
    } catch (error) {
      console.log(error);
    }
  }

  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      setCommentLoading(true);
      let res = await axios.post(serverUrl + `/api/post/comment/${id}`, {
        content: commentContent
      }, { withCredentials: true });
      setComments(res.data.comment);
      setCommentContent("");
    } catch (error) {
      console.log(error);
    } finally {
      setCommentLoading(false);
    }
  }

  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      if (postId == id) {
        setLikes(likes)
      }
    })
    socket.on("commentAdded", ({ postId, comm }) => {
      if (postId == id) {
        setComments(comm)
      }
    })

    return () => {
      socket.off("likeUpdated")
      socket.off("commentAdded")
    }
  }, [id]);

  useEffect(() => {
    setLikes(like);
    setComments(comment);
  }, [like, comment])

  const isLikedByMe = likes.includes(userData._id);
  const [showComment, setShowComment] = useState(false);

  return (
    <div className='bg-white w-full rounded-xl shadow-sm border border-gray-200 p-4'>
      <div className='flex justify-between'>
        <div className='flex items-center gap-3 min-w-0 cursor-pointer' onClick={() => handleGetProfile(author.userName)}>
          <div className='rounded-full w-[52px] h-[52px] shrink-0 overflow-hidden bg-gray-100'>
            <img src={author.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
          </div>
          <div className='min-w-0'>
            <h1 className='font-semibold text-[16px] text-gray-900 truncate'>{author.firstName} {author.lastName}</h1>
            <p className='font-medium text-[13px] text-gray-500 truncate'>{author.headline}</p>
            <p className='text-[12px] text-gray-400'>{moment(createdAt).fromNow()}</p>
          </div>
        </div>
        <div className='shrink-0'>
          {userData._id != author._id && <ConnectionButton userId={author._id} />}
        </div>
      </div>

      <div className='mt-3'>
        <p className={`text-[15px] text-gray-800 leading-relaxed whitespace-pre-line ${!more ? "max-h-[75px] overflow-hidden" : ""}`}>{description}</p>
        {description && description.length > 150 &&
          <span className='font-semibold text-[13px] text-gray-500 hover:text-[#0a66c2] cursor-pointer transition-colors' onClick={() => setMore((prev) => !prev)}>
            {more ? "Show less" : "...Show more"}
          </span>
        }
      </div>

      {image &&
        <div className='w-full mt-3 rounded-lg overflow-hidden border border-gray-100'>
          <img className='w-full max-h-[420px] object-cover' src={image} alt="" />
        </div>
      }

      {/* Like / comment summary */}
      {(likes.length > 0 || comments.length > 0) &&
        <div className='flex justify-between items-center mt-3 text-[13px] text-gray-500'>
          <div className='flex items-center gap-1'>
            {likes.length > 0 &&
              <>
                <span className='w-[18px] h-[18px] rounded-full bg-[#0a66c2] flex items-center justify-center'>
                  <AiFillLike className='text-white text-[10px]' />
                </span>
                <span>{likes.length}</span>
              </>
            }
          </div>
          {comments.length > 0 &&
            <span className='cursor-pointer hover:underline' onClick={() => setShowComment((prev) => !prev)}>
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          }
        </div>
      }

      <div className='w-full h-[1px] bg-gray-200 mt-3 mb-1'></div>

      {/* Action bar */}
      <div className='flex gap-1'>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-[14px] transition-colors hover:bg-gray-100 ${isLikedByMe ? "text-[#0a66c2]" : "text-gray-600"}`}
          onClick={handleLike}
        >
          <span className={likeAnimating ? "animate-[pulse_0.3s_ease-in-out]" : ""}>
            {isLikedByMe ? <AiFillLike className='text-[20px]' /> : <AiOutlineLike className='text-[20px]' />}
          </span>
          {isLikedByMe ? "Liked" : "Like"}
        </button>
        <button
          className='flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-[14px] text-gray-600 hover:bg-gray-100 transition-colors'
          onClick={() => setShowComment((prev) => !prev)}
        >
          <FaRegCommentDots className='text-[19px]' />
          Comment
        </button>
      </div>

      {/* Comments section */}
      {showComment &&
        <div className='mt-3 pt-3 border-t border-gray-100'>
          <form className='w-full flex items-center gap-2 bg-gray-100 rounded-full pl-4 pr-1.5 h-[42px]' onSubmit={handleComment}>
            <input
              type="text"
              className='flex-1 h-full outline-none bg-transparent text-[14px]'
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder='Add a comment...'
            />
            <button
              type="submit"
              disabled={commentLoading || !commentContent.trim()}
              className='w-[32px] h-[32px] rounded-full flex items-center justify-center bg-[#0a66c2] disabled:bg-gray-300 transition-colors shrink-0'
            >
              <IoMdSend className='text-[16px] text-white' />
            </button>
          </form>

          {comments.length === 0 ? (
            <p className='text-gray-400 text-sm text-center py-4'>No comments yet. Be the first to comment.</p>
          ) : (
            <div className='space-y-3 mt-3'>
              {comments.slice().reverse().map((com, idx) => (
                <div key={com._id || idx} className='flex items-start gap-2.5'>
                  <div className='rounded-full w-[38px] h-[38px] shrink-0 overflow-hidden bg-gray-100'>
                    <img src={com.user.profileImage || empty_profile} alt="" className='w-full h-full object-cover' />
                  </div>
                  <div className='bg-gray-100 rounded-2xl px-3.5 py-2 flex-1 min-w-0'>
                    <h1 className='font-semibold text-[13px] text-gray-900'>{com.user.firstName} {com.user.lastName}</h1>
                    <p className='text-[14px] text-gray-800 break-words'>{com.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    </div>
  )
}

export default Post