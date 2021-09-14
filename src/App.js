import './App.css';
import React, { useState, useEffect } from 'react'

import * as fcl from "@onflow/fcl"
import * as t from '@onflow/types';


fcl.config()
  // Point App at Emulator
  .put("accessNode.api", "http://localhost:8080")
  // Point FCL Wallet Discovuer at Dev Wallet
  .put("discovery.wallet", "http://localhost:8701/fcl/authn") // with default port configuration

// FOR TESTNET
//.put("accessNode.api", "https://access-testnet.onflow.org") // Flow testnet
//.put("challenge.handshake", "https://flow-wallet-testnet.blocto.app/authn")

const mintFlowToken = `
import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79

transaction(recipient: Address, amount: UFix64) {
    let tokenAdmin: &FlowToken.Administrator
    let tokenReceiver: &{FungibleToken.Receiver}

    prepare(signer: AuthAccount) {
        self.tokenAdmin = signer
            .borrow<&FlowToken.Administrator>(from: /storage/flowTokenAdmin)
            ?? panic("Signer is not the token admin")

        self.tokenReceiver = getAccount(recipient)
            .getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Unable to borrow receiver reference")
    }

    execute {
        let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
        let mintedVault <- minter.mintTokens(amount: amount)

        self.tokenReceiver.deposit(from: <-mintedVault)

        destroy minter
    }
}
`

const flowTokenBalance = `
// This script reads the balance field of an account's FlowToken Balance

import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79

pub fun main(account: Address): UFix64 {

    let vaultRef = getAccount(account)
        .getCapability(/public/flowTokenBalance)
        .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}
`

function App() {
  const [response, setResponse] = useState(null)
  const [user, setUser] = useState("")

  const handleUser = (user) => {
    if (user.cid) {
      setUser(user);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // We need to subscribe the user so we can use it to sign transactions and stuff
    return fcl.currentUser().subscribe(handleUser)
  }, [])

  const mintFlowTokenFunc = async (event) => {
    event.preventDefault()

    const transactionId = await fcl.send([
      fcl.transaction(mintFlowToken),
      fcl.args([
        fcl.arg(user.addr, t.Address),
        fcl.arg("30.0", t.UFix64)
      ]),
      fcl.proposer(fcl.authz),
      fcl.payer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.limit(100)
    ]);

    return fcl.tx(transactionId).onceSealed();
  };

  const flowTokenBalanceFunc = async (event) => {
    event.preventDefault()

    const response = await fcl.send([
      fcl.script(flowTokenBalance),
      fcl.args([
        fcl.arg(user.addr, t.Address)
      ])
    ])

    let data = await fcl.decode(response)

    setResponse(data)
  };

  const authIn = () => {
    fcl.signUp()
    console.log("Hey there. I just authenticated.")
  }

  const authOut = () => {
    fcl.unauthenticate()
    console.log("Hey there. I just unauthenticated.")
  }

  return (
    <div className="App">
      <button onClick={authIn}>Login</button>
      <button onClick={authOut}>Logout</button>
      <button onClick={mintFlowTokenFunc}>1. Mint the Flow</button>
      <button onClick={flowTokenBalanceFunc}>2. Read Flow Token Balance</button>
      <p>Response: {response ? response : "No response!"}</p>
      <p>Address: {user ? user.addr : "No one is signed in"}</p>
    </div>
  );
}

export default App;
