import { newFlatSubsocialApi } from '@subsocial/api'
import { FlatSubsocialApi } from '@subsocial/api/flat-subsocial'
import { ProfileData } from '@subsocial/types/dto'
import config from './config'
import {
  IpfsContent,
  OptionBool,
  SpaceUpdate
} from "@subsocial/types/substrate/classes"

let flatApi: FlatSubsocialApi
let selectedAddress: string
let selectedProfile: ProfileData | undefined
const spaceId = '1015'

export const connect = async () => flatApi = await newFlatSubsocialApi({
  ...config,
  useServer: {
    httpRequestMethod: 'get'
  }
})

export const signAndSendTx = async (tx: any) => {
  const { isWeb3Injected, web3Enable, web3AccountsSubscribe, web3FromAddress } = await import('@polkadot/extension-dapp')
  const injectedExtensions = await web3Enable('twitter-dapp-subsocial')
  if (!isWeb3Injected) {
    alert('Browser do not have any polkadot extension')
    return;
  }

  if (!injectedExtensions.length) {
    alert('Polkadot Extension have not authorized us to get accounts');
    return;
  }

  await web3AccountsSubscribe(async (accounts) => {
    if (accounts.length > 0) {
      const addresses = accounts.map((account) => account.address)

      const { signer } = await web3FromAddress(addresses[0])
      await tx.signAsync(addresses[0], { signer })

      await tx.send((result: any) => {
        const { status } = result

        if (!result || !status) {
          return;
        }
        if (status.isFinalized || status.isInBlock) {
          const blockHash = status.isFinalized
            ? status.asFinalized
            : status.asInBlock;
          console.log('✅ Tx finalized. Block hash', blockHash.toString());
        } else if (result.isError) {
          console.log(JSON.stringify(result));
        } else {
          console.log('⏱ Current tx status:', status.type);
        }
      })

    }
  })
}

export const fetchProfile = async (address: string) => {
  const accountId = address
  const profile = await flatApi.findProfile(accountId)
  console.log(profile)
  selectedAddress = address
  selectedProfile = profile
}

export const fetchPosts = async () => {
  const postIds = await flatApi.subsocial.substrate.postIdsBySpaceId(spaceId as any)

  const posts = await flatApi.subsocial.findPosts({ ids: postIds })

  console.log(posts)
  return posts
}

export const createSpace = async () => {
  const cid = await flatApi.subsocial.ipfs.saveContent({
    about: 'Coders Space',
    name: 'Live Streamers',
    tags: ['youtuber', 'builder']
  } as any)

  const substrateApi = await flatApi.subsocial.substrate.api

  const spaceTransaction = substrateApi.tx.spaces.createSpace(
    null, // Parent Id (optional)
    null, // Handle name (optional)
    IpfsContent(cid),
    null // Permissions config (optional)
  )

  signAndSendTx(spaceTransaction)

}

export const postTweet = async (tweet: string) => {
  const cid = await flatApi.subsocial.ipfs.saveContent({
    title: selectedProfile ? selectedProfile.content?.name : selectedAddress,
    body: tweet,
    avatar: selectedProfile ? selectedProfile.content?.avatar : ''
  })

  const substrateApi = await flatApi.subsocial.substrate.api
  const postTransaction = substrateApi.tx.posts.createPost(
    spaceId, 
    { RegularPost: null }, // Creates a regular post.
    IpfsContent(cid)
  )
  signAndSendTx(postTransaction)
}

export const likeTweet = async (tweetId: string) => {
  const substrateApi = flatApi.subsocial.substrate.api

  const reactionTx = (await substrateApi).tx.reactions.createPostReaction(tweetId, 'Upvote')
  signAndSendTx(reactionTx)
}

