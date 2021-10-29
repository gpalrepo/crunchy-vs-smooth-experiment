const assert = require("assert");
const anchor = require("@project-serum/anchor");
const solana = require("@solana/web3.js");

const { LAMPORTS_PER_SOL, SYSVAR_CLOCK_PUBKEY } = solana;

const { Keypair, SystemProgram, PublicKey } = anchor.web3;


describe("crunchy-vs-smooth", () => {
  // Configure the client
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  async function airdrop(publicKey) {
    await provider.connection
      .requestAirdrop(publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
  }

  const program = anchor.workspace.CrunchyVsSmooth;
  let alice;
  console.log('Printing Lamports')
  console.log(LAMPORTS_PER_SOL)

  let voteAccount, voteAccountBump;
  let voteAccountTwo, voteAccountBumpTwo;
  before(async () => {
     alice = await Keypair.generate();
     await airdrop(alice.publicKey);

    [voteAccount, voteAccountBump] =
    // Need to switch this to user's PDA
      await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(),Buffer.from("vote_account")],
        program.programId
      );
    [voteAccountTwo, voteAccountBumpTwo] =  await anchor.web3.PublicKey.findProgramAddress(
      [alice.publicKey.toBuffer(), Buffer.from("vote_account")],
      program.programId
    );
  });



  
  it("Initializes with 0 votes for crunchy and smooth", async () => {


      console.log(voteAccount)
      console.log(voteAccountBump)
    
    await program.rpc.initialize(new anchor.BN(voteAccountBump), {
      accounts: {
        user: provider.wallet.publicKey,
        voteAccount: voteAccount, //Note this is a public key
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(0, currentVoteAccountState.crunchy.toNumber());
    assert.equal(0, currentVoteAccountState.smooth.toNumber());
  });

  it("Votes correctly for crunchy", async () => {
    await program.rpc.voteCrunchy({
      accounts: {
        voteAccount: voteAccount,
        user: provider.wallet.publicKey,
      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(1, currentVoteAccountState.crunchy.toNumber());
    assert.equal(0, currentVoteAccountState.smooth.toNumber());
  });

  it("Votes correctly for smooth", async () => {
    await program.rpc.voteSmooth({
      accounts: {
        voteAccount: voteAccount,
        user: provider.wallet.publicKey,

      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(1, currentVoteAccountState.crunchy.toNumber());
    assert.equal(1, currentVoteAccountState.smooth.toNumber());
  });

      //Start of initializing Alice's Account 
      it("Initializes with 0 votes for crunchy and smooth for Account 2 (Alice)", async () => {
    
        await program.rpc.initialize(new anchor.BN(voteAccountBumpTwo), {
          accounts: {
            user: alice.publicKey,
            voteAccount: voteAccountTwo, //Note this is a public key
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers:[alice]
          });
      
        let currentVoteAccountState = await program.account.votingState.fetch(
          voteAccountTwo
        );
        assert.equal(0, currentVoteAccountState.crunchy.toNumber());
        assert.equal(0, currentVoteAccountState.smooth.toNumber());
      });


});
