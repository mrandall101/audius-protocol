const models = require('../models')
const config = require('../config')

const solanaClaimableTokenProgramAddress = config.get('solanaClaimableTokenProgramAddress')
const solanaTrackListenCountAddress = config.get('solanaTrackListenCountAddress')
const solanaRewardsManagerProgramId = config.get('solanaRewardsManagerProgramId')
const solanaRewardsManagerAuthority = config.get('solanaRewardsManagerAuthority')
const solanaClaimableTokenAuthority = config.get('solanaClaimableTokenAuthority')

const allowedProgramIds = new Set([
  solanaClaimableTokenProgramAddress,
  solanaTrackListenCountAddress,
  solanaRewardsManagerProgramId,
  /* secp */ 'KeccakSecp256k11111111111111111111111111111'
])

/**
 * Maps the instruction enum to the index of the rewards manager authority account
 * @see {@link [../../../solana-programs/reward-manager/program/src/instruction.rs](https://github.com/AudiusProject/audius-protocol/blob/db31fe03f2c8cff357379b84130539d51ccca213/solana-programs/reward-manager/program/src/instruction.rs#L60)}
 */
const rewardManagerAuthorityIndices = {
  0: 4, // InitRewardManager
  1: -1, // ChangeManagerAccount
  2: 2, // CreateSender
  3: 2, // DeleteSender
  4: 1, // CreateSenderPublic
  5: -1, // DeleteSenderPublic
  6: 2, // SubmitAttestations
  7: 2 // EvaluateAttestations
}

/**
 * Maps the instruction enum to the index of the claimable token authority account
 * @see {@link [../../../solana-programs/claimable-tokens/program/src/instruction.rs](https://github.com/AudiusProject/audius-protocol/blob/2c93f29596a1d6cc8ca4e76ef1f0d2e57f0e09e6/solana-programs/claimable-tokens/program/src/instruction.rs#L21)}
 */
const claimableTokenAuthorityIndices = {
  0: 2,
  1: 4
}

/**
 * @typedef Instruction
 * @property {string} programId
 * @property {{data: number[], type: string}} data
 * @property {{pubkey: string, isSigner: boolean, isWriteable: boolean}[]} keys
 */

const isRelayAllowedProgram = instructions => {
  for (const instruction of instructions) {
    if (!allowedProgramIds.has(instruction.programId)) {
      return false
    }
  }
  return true
}

const isSendInstruction = instr => instr.length &&
  instr[1] && instr[1].programId === solanaClaimableTokenProgramAddress &&
  instr[1].data &&
  instr[1].data.data &&
  instr[1].data.data[0] === 1

async function doesUserHaveSocialProof (userInstance) {
  const { blockchainUserId } = userInstance
  const twitterUser = await models.TwitterUser.findOne({ where: {
    blockchainUserId
  } })

  const instagramUser = await models.InstagramUser.findOne({ where: {
    blockchainUserId
  } })
  return !!twitterUser || !!instagramUser
}

/**
 * Gets the enum identifier of the instruction as determined by the first element of the data buffer
 * @param {Instruction} instruction
 * @returns the enum value of the given instruction
 */
const getInstructionEnum = instruction => {
  if (instruction.data && instruction.data.data && instruction.data.data.length > 0) {
    return instruction.data.data[0]
  }
  return -1
}

/**
 * Checks the authority being used for the relayed instruction, if applicable
 * Ensures we relay only for instructions relevant to the base account cared about
 * @param {Instruction} instruction
 * @returns true if the program authority matches, false if it doesn't, and null if not applicable
 */
const hasAllowedAuthority = instruction => {
  let instructionEnum, authorityIndices, allowedAuthority
  if (instruction.programId === solanaRewardsManagerProgramId) {
    instructionEnum = getInstructionEnum(instruction)
    authorityIndices = rewardManagerAuthorityIndices
    allowedAuthority = solanaRewardsManagerAuthority
  } else if (instruction.programId === solanaClaimableTokenProgramAddress) {
    instructionEnum = getInstructionEnum(instruction)
    authorityIndices = claimableTokenAuthorityIndices
    allowedAuthority = solanaClaimableTokenAuthority
  }
  if (authorityIndices && allowedAuthority && instructionEnum > -1 && instructionEnum < authorityIndices.length) {
    const index = authorityIndices[instructionEnum]
    return instruction.keys && index < instruction.keys.length && instruction.keys[index].pubkey === allowedAuthority
  }
  return null
}

/**
 * Checks that all the given instructions have an allowed authority (if applicable)
 * @param {Instruction[]} instructions
 * @returns true if all the instructions have allowed authorities
 */
const isRelayAllowedForAuthority = instructions => {
  for (const instruction of instructions) {
    if (hasAllowedAuthority(instruction) === false) {
      return false
    }
  }
  return true
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  isRelayAllowedProgram,
  isRelayAllowedForAuthority
}
