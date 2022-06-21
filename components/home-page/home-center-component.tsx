import dynamic from 'next/dynamic';
import ReactList from 'react-list';
import { useEffect, useState } from 'react';
import { connect, fetchPosts } from '~/logics';
import { ITweet } from '../shared/tweet';
const TweetComponent = dynamic(() => import('../shared/tweet'), { ssr: false });
const TweetBox = dynamic(() => import('./tweet-box'), { ssr: false });

const HomeCenterComponent = () => {

  const [tweets, setTweets] = useState<ITweet[]>([])

  const fetchData = async () => {
    await connect()
    const data = await fetchPosts()
    const tweetsData = data.map((tweet) => {
      const { content, struct } = tweet
      return {
        id: struct.id,
        description: content?.body,
        username: content?.title,
        name: struct.owner.toString(),
        avatar: "/images/personal.jpg",
        date: Date.now(),
        likes: struct.upvotesCount.toNumber(),
        replies: struct.repliesCount.toNumber(),
        retweets: struct.repliesCount.toNumber(),
      }
    })
    setTweets(tweetsData as any as ITweet[])
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <div className="p-3 border-b border-white border-opacity-15 sticky top-0 bg-dark z-50">
        <span className="text-white text-xl font-extrabold">Home</span>
      </div>
      <TweetBox />
      <div>
        <ReactList
          type="variable"
          axis="y"
          length={tweets.length}
          itemRenderer={(idx, key) => <TweetComponent key={key} {...tweets[idx]} />}
        />
      </div>
    </div>
  );
};

export default HomeCenterComponent;
