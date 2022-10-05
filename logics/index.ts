import { SubsocialApi, SubsocialIpfsApi } from '@subsocial/api'
import config from './config'
import {
  IpfsContent
} from '@subsocial/api/substrate/wrappers'
import { RawSpaceData } from '@subsocial/api/types'
import { generateCrustAuthToken } from '@subsocial/api/utils/ipfs'
import { waitReady } from '@polkadot/wasm-crypto'

let flatApi: SubsocialApi
let ipfs: SubsocialIpfsApi
let selectedAddress: string
let selectedProfile: RawSpaceData | undefined
const spaceId = '9953'

export const connect = async () => {

  console.log('connecting....')
  flatApi = await SubsocialApi.create({
    ...config,
    useServer: {
      httpRequestMethod: 'get'
    }
  })

  await waitReady()
  const authHeader = generateCrustAuthToken('bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice')

  ipfs = new SubsocialIpfsApi({
    ipfsNodeUrl: 'https://crustwebsites.net'
  })

  ipfs.setWriteHeaders({
    authorization: 'Basic ' + authHeader
  })
  console.log('connected. ', flatApi)
}

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
  const profileSpaceId = await flatApi.blockchain.profileSpaceIdByAccount(accountId)
  const profile = await flatApi.base.findSpace({ id: profileSpaceId.toString() })
  console.log(profileSpaceId.toString(), JSON.stringify(profile?.struct))
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
  const cid = await ipfs.saveContent({
    about: 'Coders Space',
    name: 'Live Streamers',
    tags: ['youtuber', 'builder']
  } as any)

  const substrateApi = await flatApi.blockchain.api

  const spaceTransaction = substrateApi.tx.spaces.createSpace(
    IpfsContent(cid),
    null // Permissions config (optional)
  )

  signAndSendTx(spaceTransaction)

}

export const postTweet = async (tweet: string) => {
  console.log('ipfs', ipfs)
  const cid = await ipfs.saveContent({
    title: selectedProfile && selectedProfile.content?.name ? selectedProfile.content?.name : selectedAddress,
    body: tweet,
    avatar: selectedProfile && selectedProfile.content?.image ? selectedProfile.content?.image : ''
  })
  console.log(cid)

  const substrateApi = await flatApi.blockchain.api
  const postTransaction = substrateApi.tx.posts.createPost(
    spaceId,
    { RegularPost: null }, // Creates a regular post.
    { IPFS: IpfsContent(cid) }
  )
  signAndSendTx(postTransaction)
}

export const likeTweet = async (tweetId: string) => {
  const substrateApi = flatApi.blockchain.api

  const reactionTx = (await substrateApi).tx.reactions.createPostReaction(tweetId, 'Upvote')
  signAndSendTx(reactionTx)
}

