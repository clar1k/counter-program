import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CounterProgram } from "../target/types/counter_program";
import {
  Address,
  address,
  airdropFactory,
  getProgramDerivedAddress,
  lamports,
} from "@solana/kit";
import { assert } from "chai";

describe("counter-program", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.counterProgram as Program<CounterProgram>;
  const keypair = anchor.web3.Keypair.generate();
  const counterSeed = anchor.utils.bytes.utf8.encode("counter");
  let counterPub: Address;
  let _;

  before(async () => {
    [counterPub, _] = await getProgramDerivedAddress({
      programAddress: address(program.programId.toString()),
      seeds: [counterSeed],
    });
    const tx = await provider.connection.requestAirdrop(
      keypair.publicKey,
      1 * 1000000000
    );
  });

  it("Creates account for incrementing", async () => {
    const tx = await program.methods.initialize().accounts([counterPub]).rpc();
    const counterAccount = await program.account.counter.fetch(counterPub);
    const binaryZero = new anchor.BN(0);
    assert.ok(counterAccount.count.eq(binaryZero));
  });
  it("Creates custom account for counter", async () => {
    const [counterPub, bumpSeed] = await getProgramDerivedAddress({
      programAddress: address(program.programId.toString()),
      seeds: [Buffer.from("counter"), keypair.publicKey.toBuffer()],
    });
    const tx = await program.methods
      .createSeparateCounter()
      .accounts({ authority: keypair.publicKey })
      .signers([keypair])
      .rpc();
  });
  it("Increments separate counter", async () => {
    const [counterAccountAddress, seed] = await getProgramDerivedAddress({
      programAddress: address(program.programId.toString()),
      seeds: [Buffer.from("counter"), keypair.publicKey.toBuffer()],
    });
    const tx = await program.methods
      .incrementSeparateCounter()
      .accounts({ counter: counterAccountAddress, signer: keypair.publicKey })
      .signers([keypair])
      .rpc();
    const accountData = await program.account.counter.fetch(
      counterAccountAddress
    );
    const binaryOne = new anchor.BN(11);
    assert.ok(accountData.count.eq(binaryOne));
  });
  it("Increments account", async () => {
    const tx = await program.methods.increment().accounts([counterPub]).rpc();
    const counterAccount = await program.account.counter.fetch(counterPub);
    const binaryOne = new anchor.BN(1);
    assert.ok(
      counterAccount.count.eq(binaryOne),
      "Not incremented data from account"
    );
  });
});
