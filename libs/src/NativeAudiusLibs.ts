import type { provider } from 'web3-core'
import Web3 from './LibsWeb3'
import { version } from './version'
import { Hedgehog, HedgehogConfig } from './services/hedgehog'
import type { Hedgehog as HedgehogBase } from '@audius/hedgehog'
import { CreatorNode, CreatorNodeConfig } from './services/creatorNode'
import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from './services/discoveryProvider'
import { Schemas, SchemaValidator } from './services/schemaValidator'
import { UserStateManager } from './userStateManager'
import type { Logger, CaptchaConfig, Nullable } from './utils'
import { Captcha, Utils } from './utils'

import { Keypair, PublicKey } from '@solana/web3.js'

import { getPlatformLocalStorage, LocalStorage } from './utils/localStorage'
import { Web3Config, Web3Manager } from './services/web3Manager'
import { EthWeb3Config, EthWeb3Manager } from './services/ethWeb3Manager'
import { Comstock } from './services/comstock'
import { IdentityService } from './services/identity'
import { EthContracts } from './services/ethContracts'
import {
  SolanaWeb3Manager,
  SolanaUtils,
  SolanaWeb3Config
} from './services/solana'
import { AudiusContracts } from './services/dataContracts'
import { Account } from './api/Account'
import { Users } from './api/Users'
import { Track } from './api/Track'
import { Playlists } from './api/Playlist'
import { Rewards } from './api/Rewards'
import { Reactions } from './api/Reactions'
import { File } from './api/File'
import { ServiceProvider } from './api/ServiceProvider'
import type { BaseConstructorArgs } from './api/base'
import type { MonitoringCallbacks } from './services/types'
import { EntityManager } from './api/entityManager'

type LibsIdentityServiceConfig = {
  url: string
  useHedgehogLocalStorage: boolean
}

type LibsHedgehogConfig = Omit<
  HedgehogConfig,
  'identityService' | 'localStorage'
>

type LibsSolanaWeb3Config = SolanaWeb3Config & {
  // fee payer secret keys, if client wants to switch between different fee payers during relay
  feePayerSecretKeys?: Uint8Array[]
}

type LibsDiscoveryProviderConfig = Omit<
  DiscoveryProviderConfig,
  'userStateManager' | 'ethContracts' | 'web3Manager'
>

type LibsComstockConfig = {
  url: string
}

type AudiusLibsConfig = {
  web3Config: Web3Config
  ethWeb3Config: EthWeb3Config
  solanaWeb3Config: SolanaWeb3Config
  identityServiceConfig: LibsIdentityServiceConfig
  discoveryProviderConfig: LibsDiscoveryProviderConfig
  creatorNodeConfig: CreatorNodeConfig
  comstockConfig: LibsComstockConfig
  captchaConfig: CaptchaConfig
  hedgehogConfig: LibsHedgehogConfig
  isServer: boolean
  logger: Logger
  isDebug: boolean
  preferHigherPatchForPrimary: boolean
  preferHigherPatchForSecondaries: boolean
  localStorage: LocalStorage
}

export class AudiusLibs {
  /**
   * Configures an identity service wrapper
   */
  static configIdentityService(
    url: string,
    // whether or not to read hedgehog entropy in local storage
    useHedgehogLocalStorage = true
  ) {
    return { url, useHedgehogLocalStorage }
  }

  /**
   * Configures an identity service wrapper
   */
  static configComstock(url: string) {
    return { url }
  }

  static configCreatorNode(
    // creator node endpoint to fall back to on requests
    fallbackUrl: string,
    // whether to delay connection to the node until the first request that requires a connection is made.
    lazyConnect = false,
    // whether or not to include only specified nodes (default null)
    passList: Nullable<Set<string>> = null,
    // whether or not to exclude any nodes (default null)
    blockList: Nullable<Set<string>> = null,
    // callbacks to be invoked with metrics from requests sent to a service
    monitoringCallbacks: Nullable<MonitoringCallbacks> = {},
    // whether or not to enforce waiting for replication to 2/3 nodes when writing data
    writeQuorumEnabled = false
  ) {
    return {
      fallbackUrl,
      lazyConnect,
      passList,
      blockList,
      monitoringCallbacks,
      writeQuorumEnabled
    }
  }

  /**
   * Configures an external web3 to use with Audius Libs (e.g. MetaMask)
   */
  static async configExternalWeb3(
    registryAddress: string,
    // equal to web.currentProvider
    web3Provider: string,
    // network chain id
    networkId: string,
    // wallet address to force use instead of the first wallet on the provided web3
    walletOverride: Nullable<string> = null,
    // entity manager address
    entityManagerAddress: Nullable<string> = null
  ) {
    const web3Instance = await Utils.configureWeb3(web3Provider, networkId)
    if (!web3Instance) {
      throw new Error('External web3 incorrectly configured')
    }
    const wallets = await web3Instance.eth.getAccounts()
    return {
      registryAddress,
      entityManagerAddress,
      useExternalWeb3: true,
      externalWeb3Config: {
        web3: web3Instance,
        ownerWallet: walletOverride ?? wallets[0]
      }
    }
  }

  /**
   * Configures an internal web3 to use (via Hedgehog)
   */
  static configInternalWeb3(
    registryAddress: string,
    providers: provider,
    privateKey?: string,
    entityManagerAddress?: string
  ) {
    let providerList
    if (typeof providers === 'string') {
      providerList = providers.split(',')
    } else if (providers instanceof Web3) {
      providerList = [providers]
    } else if (Array.isArray(providers)) {
      providerList = providers
    } else {
      throw new Error(
        'Providers must be of type string, Array, or Web3 instance'
      )
    }

    return {
      registryAddress,
      entityManagerAddress,
      useExternalWeb3: false,
      internalWeb3Config: {
        web3ProviderEndpoints: providerList,
        privateKey
      }
    }
  }

  /**
   * Configures an eth web3
   */
  static configEthWeb3(
    tokenAddress: string,
    registryAddress: string,
    // web3 provider endpoint(s)
    providers: provider,
    // owner wallet to establish who we are sending transactions on behalf of
    ownerWallet?: string,
    claimDistributionContractAddress?: string,
    wormholeContractAddress?: string
  ) {
    let providerList
    if (typeof providers === 'string') {
      providerList = providers.split(',')
    } else if (providers instanceof Web3) {
      providerList = [providers]
    } else if (Array.isArray(providers)) {
      providerList = providers
    } else {
      throw new Error(
        'Providers must be of type string, Array, or Web3 instance'
      )
    }

    return {
      tokenAddress,
      registryAddress,
      providers: providerList,
      ownerWallet,
      claimDistributionContractAddress,
      wormholeContractAddress
    }
  }

  /**
   * Configures wormhole
   * This is a stubbed version for native
   */
  static configWormhole() {
    return {}
  }

  /**
   * Configures a solana web3
   */
  static configSolanaWeb3({
    solanaClusterEndpoint,
    mintAddress,
    solanaTokenAddress,
    claimableTokenPDA,
    feePayerAddress,
    claimableTokenProgramAddress,
    rewardsManagerProgramId,
    rewardsManagerProgramPDA,
    rewardsManagerTokenPDA,
    useRelay,
    feePayerSecretKeys,
    confirmationTimeout,
    audiusDataAdminStorageKeypairPublicKey,
    audiusDataProgramId,
    audiusDataIdl
  }: LibsSolanaWeb3Config): SolanaWeb3Config {
    if (audiusDataAdminStorageKeypairPublicKey instanceof String) {
      audiusDataAdminStorageKeypairPublicKey = new PublicKey(
        audiusDataAdminStorageKeypairPublicKey
      )
    }
    if (audiusDataProgramId instanceof String) {
      audiusDataProgramId = new PublicKey(audiusDataProgramId)
    }
    return {
      solanaClusterEndpoint,
      mintAddress,
      solanaTokenAddress,
      claimableTokenPDA,
      feePayerAddress,
      claimableTokenProgramAddress,
      rewardsManagerProgramId,
      rewardsManagerProgramPDA,
      rewardsManagerTokenPDA,
      useRelay,
      feePayerKeypairs: feePayerSecretKeys?.map((key) =>
        Keypair.fromSecretKey(key)
      ),
      confirmationTimeout,
      audiusDataAdminStorageKeypairPublicKey,
      audiusDataProgramId,
      audiusDataIdl
    }
  }

  /**
   * Configures a solana audius-data
   * This is a stubbed version for native
   */
  static configSolanaAudiusData() {
    return {}
  }

  version: string

  ethWeb3Config: EthWeb3Config
  web3Config: Web3Config
  solanaWeb3Config: SolanaWeb3Config
  identityServiceConfig: LibsIdentityServiceConfig
  creatorNodeConfig: CreatorNodeConfig
  discoveryProviderConfig: LibsDiscoveryProviderConfig
  comstockConfig: LibsComstockConfig
  captchaConfig: CaptchaConfig
  hedgehogConfig: LibsHedgehogConfig
  isServer: boolean
  isDebug: boolean
  logger: Logger

  // Services to initialize. Initialized in .init().
  userStateManager: Nullable<UserStateManager>
  identityService: Nullable<IdentityService>
  hedgehog: Nullable<HedgehogBase>
  discoveryProvider: Nullable<DiscoveryProvider>
  ethWeb3Manager: Nullable<EthWeb3Manager>
  ethContracts: Nullable<EthContracts>
  web3Manager: Nullable<Web3Manager>
  solanaWeb3Manager: Nullable<SolanaWeb3Manager>
  contracts: Nullable<AudiusContracts>
  creatorNode: Nullable<CreatorNode>
  captcha: Nullable<Captcha>
  schemas?: Schemas
  comstock: Nullable<Comstock>

  // // API
  ServiceProvider: Nullable<ServiceProvider>
  Account: Nullable<Account>
  User: Nullable<Users>
  Track: Nullable<Track>
  Playlist: Nullable<Playlists>
  File: Nullable<File>
  Rewards: Nullable<Rewards>
  Reactions: Nullable<Reactions>
  EntityManager: Nullable<EntityManager>

  preferHigherPatchForPrimary: boolean
  preferHigherPatchForSecondaries: boolean
  localStorage: LocalStorage

  /**
   * Constructs an Audius Libs instance with configs.
   * Unless default-valued, all configs are optional.
   * @example
   *  const audius = AudiusLibs({
   *    discoveryProviderConfig: {},
   *    creatorNodeConfig: configCreatorNode('https://my-creator.node')
   *  })
   *  await audius.init()
   */
  constructor({
    web3Config,
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig,
    creatorNodeConfig,
    comstockConfig,
    captchaConfig,
    hedgehogConfig,
    isServer,
    logger = console,
    isDebug = false,
    preferHigherPatchForPrimary = true,
    preferHigherPatchForSecondaries = true,
    localStorage = getPlatformLocalStorage()
  }: AudiusLibsConfig) {
    // set version

    this.version = version

    this.ethWeb3Config = ethWeb3Config
    this.web3Config = web3Config
    this.solanaWeb3Config = solanaWeb3Config
    this.identityServiceConfig = identityServiceConfig
    this.creatorNodeConfig = creatorNodeConfig
    this.discoveryProviderConfig = discoveryProviderConfig
    this.comstockConfig = comstockConfig
    this.captchaConfig = captchaConfig
    this.hedgehogConfig = hedgehogConfig
    this.isServer = isServer
    this.isDebug = isDebug
    this.logger = logger

    // Services to initialize. Initialized in .init().
    this.userStateManager = null
    this.identityService = null
    this.hedgehog = null
    this.discoveryProvider = null
    this.ethWeb3Manager = null
    this.ethContracts = null
    this.web3Manager = null
    this.solanaWeb3Manager = null
    this.contracts = null
    this.creatorNode = null
    this.captcha = null
    this.comstock = null

    // // API
    this.ServiceProvider = null
    this.Account = null
    this.User = null
    this.Track = null
    this.Playlist = null
    this.File = null
    this.Rewards = null
    this.Reactions = null
    this.EntityManager = null

    this.preferHigherPatchForPrimary = preferHigherPatchForPrimary
    this.preferHigherPatchForSecondaries = preferHigherPatchForSecondaries
    this.localStorage = localStorage

    // Schemas
    const schemaValidator = new SchemaValidator()
    schemaValidator.init()
    this.schemas = schemaValidator.getSchemas()
  }

  /** Init services based on presence of a relevant config. */
  async init() {
    this.userStateManager = new UserStateManager({
      localStorage: this.localStorage
    })
    // Config external web3 is an async function, so await it here in case it needs to be
    this.web3Config = await this.web3Config

    /** Captcha */
    if (this.captchaConfig) {
      this.captcha = new Captcha(this.captchaConfig)
    }

    /** Identity Service */
    if (this.identityServiceConfig) {
      this.identityService = new IdentityService({
        identityServiceEndpoint: this.identityServiceConfig.url,
        captcha: this.captcha
      })
      const hedgehogService = new Hedgehog({
        identityService: this.identityService,
        useLocalStorage: this.identityServiceConfig.useHedgehogLocalStorage,
        localStorage: this.localStorage,
        ...this.hedgehogConfig
      })
      this.hedgehog = hedgehogService.instance
      await this.hedgehog.waitUntilReady()
    } else if (this.web3Config && !this.web3Config.useExternalWeb3) {
      throw new Error('Identity Service required for internal Web3')
    }

    /** Web3 Managers */
    if (this.ethWeb3Config) {
      this.ethWeb3Manager = new EthWeb3Manager({
        web3Config: this.ethWeb3Config,
        identityService: this.identityService,
        hedgehog: this.hedgehog
      })
    }
    if (this.web3Config) {
      this.web3Manager = new Web3Manager({
        web3Config: this.web3Config,
        identityService: this.identityService,
        hedgehog: this.hedgehog,
        isServer: this.isServer
      })
      await this.web3Manager.init()
      if (this.identityService) {
        this.identityService.setWeb3Manager(this.web3Manager)
      }
    }
    if (this.solanaWeb3Config) {
      this.solanaWeb3Manager = new SolanaWeb3Manager(
        this.solanaWeb3Config,
        this.identityService,
        this.web3Manager
      )
      await this.solanaWeb3Manager.init()
    }

    /** Contracts - Eth and Data Contracts */
    const contractsToInit = []
    if (this.ethWeb3Manager) {
      const {
        tokenAddress,
        registryAddress,
        claimDistributionContractAddress,
        wormholeContractAddress
      } = this.ethWeb3Config

      this.ethContracts = new EthContracts({
        ethWeb3Manager: this.ethWeb3Manager,
        tokenContractAddress: tokenAddress,
        registryAddress,
        claimDistributionContractAddress,
        wormholeContractAddress,
        isServer: this.isServer,
        logger: this.logger,
        isDebug: this.isDebug
      })

      contractsToInit.push(this.ethContracts.init())
    }
    if (this.web3Manager) {
      this.contracts = new AudiusContracts(
        this.web3Manager,
        this.web3Config.registryAddress,
        this.web3Config.entityManagerAddress,
        this.isServer,
        this.logger
      )
      contractsToInit.push(this.contracts.init())
    }
    await Promise.all(contractsToInit)

    /** Discovery Provider */
    if (this.discoveryProviderConfig) {
      this.discoveryProvider = new DiscoveryProvider({
        userStateManager: this.userStateManager,
        ethContracts: this.ethContracts,
        web3Manager: this.web3Manager,
        localStorage: this.localStorage,
        ...this.discoveryProviderConfig
      })
      await this.discoveryProvider.init()
    }

    /** Creator Node */
    if (this.creatorNodeConfig) {
      const currentUser = this.userStateManager.getCurrentUser()
      const creatorNodeEndpoint = currentUser
        ? CreatorNode.getPrimary(currentUser.creator_node_endpoint) ??
          this.creatorNodeConfig.fallbackUrl
        : this.creatorNodeConfig.fallbackUrl

      this.creatorNode = new CreatorNode(
        this.web3Manager,
        creatorNodeEndpoint,
        this.isServer,
        this.userStateManager,
        this.creatorNodeConfig.lazyConnect,
        this.schemas,
        this.creatorNodeConfig.passList,
        this.creatorNodeConfig.blockList,
        this.creatorNodeConfig.monitoringCallbacks,
        this.creatorNodeConfig.writeQuorumEnabled
      )
      await this.creatorNode.init()
    }

    /** Comstock */
    if (this.comstockConfig) {
      this.comstock = new Comstock(this.comstockConfig.url)
    }

    // Initialize apis
    const services = [
      this.userStateManager,
      this.identityService,
      this.hedgehog,
      this.discoveryProvider,
      this.web3Manager,
      this.contracts,
      this.ethWeb3Manager,
      this.ethContracts,
      this.solanaWeb3Manager,
      null as any,
      null as any,
      this.creatorNode,
      this.comstock,
      this.captcha,
      this.isServer,
      this.logger
    ] as BaseConstructorArgs

    this.ServiceProvider = new ServiceProvider(...services)
    this.User = new Users(
      this.ServiceProvider,
      this.preferHigherPatchForPrimary,
      this.preferHigherPatchForSecondaries,
      ...services
    )
    this.Account = new Account(this.User, ...services)
    this.Track = new Track(...services)
    this.Playlist = new Playlists(...services)
    this.File = new File(this.User, ...services)
    this.Rewards = new Rewards(this.ServiceProvider, ...services)
    this.Reactions = new Reactions(...services)
    this.EntityManager = new EntityManager(...services)
  }
}

export { SolanaUtils }

export { Utils } from './utils'
export { SanityChecks } from './sanityChecks'
export { RewardsAttester } from './services/solana'
