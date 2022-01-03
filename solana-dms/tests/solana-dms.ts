import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaDms } from '../target/types/solana_dms';

describe('solana-dms', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaDms as Program<SolanaDms>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });

  it('can send tweet', async () => {
    // before sending tx to chain

    await program.rpc.sendTweet('TOPIC HERE', 'CONTENT HERE', {
      accounts: {
        // accounts
      },
      signers: [
        // signer key pairs
      ]
    });

    // after sending tx to chain
  })
});
