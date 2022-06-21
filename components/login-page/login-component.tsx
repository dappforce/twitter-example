import Logo from '../../svgs/logo.svg';
import { newFlatSubsocialApi } from '@subsocial/api'
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { connect, fetchProfile } from '~/logics';
const LoginComponent = () => {
  const router = useRouter();

  useEffect(() => {
    connect()
  }, [])

  const connectWallet = async () => {
    const { isWeb3Injected, web3Enable, web3AccountsSubscribe } = await import('@polkadot/extension-dapp')
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
        console.log(addresses[0])

        // Integrate SubSocial SDK.
        fetchProfile(addresses[0])

        router.replace('/home')
      }
    })
  };

  return (
    <div className="flex flex-col justify-center  container mt-5 text-white mx-auto">
      <Logo height="2.3rem" />
      <span className="font-bold text-2xl mt-6 pt-1 text-center">Log in to Twitter</span>
      <small className="text-center">just type anything</small>
      <div className=" lg:w-5/12 lg:px-0 px-5 w-full mt-5 mx-auto">
        <button
          onClick={connectWallet}
          type="submit"
          className={`bg-primary focus:outline-none font-bold hover:bg-primary-hover text-white rounded-full w-full py-3`}>
          Log in
        </button>
      </div>
    </div>
  );
};

export default LoginComponent;
