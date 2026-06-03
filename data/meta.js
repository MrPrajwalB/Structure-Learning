// Auto-generated metadata for all algorithms. Edited/verified per-section during build.
window.ALGOS = [
 {
  "id": "pc",
  "abbr": "PC",
  "name": "Peter-Clark",
  "section": "4.1",
  "authors": "Spirtes & Glymour",
  "year": 1991,
  "tags": [
   "constraint",
   "exact"
  ],
  "basedOn": [],
  "pageStart": 18,
  "pageEnd": 24
 },
 {
  "id": "k2",
  "abbr": "K2",
  "name": "K2",
  "section": "4.2",
  "authors": "Cooper & Herskovits",
  "year": 1992,
  "tags": [
   "score"
  ],
  "basedOn": [],
  "pageStart": 25,
  "pageEnd": 30
 },
 {
  "id": "hc",
  "abbr": "HC/Tabu",
  "name": "Hill Climbing / Tabu",
  "section": "4.3",
  "authors": "Heckerman et al.",
  "year": 1995,
  "tags": [
   "score"
  ],
  "basedOn": [],
  "pageStart": 31,
  "pageEnd": 36
 },
 {
  "id": "fci",
  "abbr": "FCI",
  "name": "Fast Causal Inference",
  "section": "4.4",
  "authors": "Spirtes et al.",
  "year": 1995,
  "tags": [
   "constraint",
   "latent",
   "exact"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 37,
  "pageEnd": 49
 },
 {
  "id": "mc3",
  "abbr": "MC3",
  "name": "MCMC Model Composition",
  "section": "4.5",
  "authors": "Madigan et al.",
  "year": 1995,
  "tags": [
   "score",
   "bma"
  ],
  "basedOn": [
   "hc"
  ],
  "pageStart": 50,
  "pageEnd": 56
 },
 {
  "id": "ga",
  "abbr": "GA",
  "name": "Genetic Algorithm",
  "section": "4.6",
  "authors": "Larranaga et al.",
  "year": 1996,
  "tags": [
   "score"
  ],
  "basedOn": [
   "k2"
  ],
  "pageStart": 57,
  "pageEnd": 61
 },
 {
  "id": "boa",
  "abbr": "BOA",
  "name": "Bayesian Optimization Algorithm",
  "section": "4.7",
  "authors": "Pelikan et al.",
  "year": 2005,
  "tags": [
   "score"
  ],
  "basedOn": [],
  "pageStart": 62,
  "pageEnd": 64
 },
 {
  "id": "gs",
  "abbr": "GS",
  "name": "Grow-Shrink",
  "section": "4.8",
  "authors": "Margaritis & Thrun",
  "year": 1999,
  "tags": [
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 65,
  "pageEnd": 69
 },
 {
  "id": "sc",
  "abbr": "SC",
  "name": "Sparse Candidate",
  "section": "4.9",
  "authors": "Friedman et al.",
  "year": 1999,
  "tags": [
   "hybrid"
  ],
  "basedOn": [
   "hc"
  ],
  "pageStart": 70,
  "pageEnd": 70
 },
 {
  "id": "tpda",
  "abbr": "TPDA",
  "name": "Three-Phase Dependency Analysis",
  "section": "4.10",
  "authors": "Cheng et al.",
  "year": 2002,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 71,
  "pageEnd": 76
 },
 {
  "id": "mmpc",
  "abbr": "MMPC",
  "name": "Max-Min Parents and Children",
  "section": "4.11",
  "authors": "Tsamardinos et al.",
  "year": 2003,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "gs"
  ],
  "pageStart": 77,
  "pageEnd": 79
 },
 {
  "id": "ges",
  "abbr": "GES",
  "name": "Greedy Equivalence Search",
  "section": "4.12",
  "authors": "Chickering",
  "year": 2002,
  "tags": [
   "score"
  ],
  "basedOn": [
   "hc"
  ],
  "pageStart": 80,
  "pageEnd": 84
 },
 {
  "id": "ordermcmc",
  "abbr": "OrderMCMC",
  "name": "Order MCMC",
  "section": "4.13",
  "authors": "Friedman & Koller",
  "year": 2003,
  "tags": [
   "score",
   "bma"
  ],
  "basedOn": [
   "mc3",
   "ga"
  ],
  "pageStart": 85,
  "pageEnd": 89
 },
 {
  "id": "hea",
  "abbr": "HEA",
  "name": "Hybrid Evolutionary Algorithm",
  "section": "4.14",
  "authors": "Wong & Leung",
  "year": 2004,
  "tags": [
   "hybrid",
   "score"
  ],
  "basedOn": [
   "pc",
   "ga"
  ],
  "pageStart": 90,
  "pageEnd": 97
 },
 {
  "id": "obs",
  "abbr": "OBS",
  "name": "Ordering-Based Search",
  "section": "4.15",
  "authors": "Teyssier & Koller",
  "year": 2005,
  "tags": [
   "score"
  ],
  "basedOn": [
   "hc",
   "ordermcmc"
  ],
  "pageStart": 98,
  "pageEnd": 101
 },
 {
  "id": "optord",
  "abbr": "OptOrd",
  "name": "Optimal Reinsertion / DP over Orderings",
  "section": "4.16",
  "authors": "Singh & Moore",
  "year": 2005,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [],
  "pageStart": 102,
  "pageEnd": 107
 },
 {
  "id": "cpc",
  "abbr": "CPC",
  "name": "Conservative PC",
  "section": "4.17",
  "authors": "Ramsey et al.",
  "year": 2006,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 108,
  "pageEnd": 110
 },
 {
  "id": "privacyk2",
  "abbr": "PrivacyK2",
  "name": "Privacy-Preserving K2",
  "section": "4.18",
  "authors": "Zhiqiang & Wright",
  "year": 2006,
  "tags": [
   "score",
   "data-distributed",
   "privacy"
  ],
  "basedOn": [
   "k2"
  ],
  "pageStart": 111,
  "pageEnd": 117
 },
 {
  "id": "lingam",
  "abbr": "LiNGAM",
  "name": "Linear Non-Gaussian Acyclic Model",
  "section": "4.19",
  "authors": "Shimizu et al.",
  "year": 2006,
  "tags": [
   "scm"
  ],
  "basedOn": [],
  "pageStart": 118,
  "pageEnd": 119
 },
 {
  "id": "tc",
  "abbr": "TC",
  "name": "Total Conditioning",
  "section": "4.20",
  "authors": "Pellet & Elisseeff",
  "year": 2008,
  "tags": [
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 120,
  "pageEnd": 125
 },
 {
  "id": "rai",
  "abbr": "RAI",
  "name": "Recursive Autonomy Identification",
  "section": "4.21",
  "authors": "Yehezkel & Lerner",
  "year": 2009,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 126,
  "pageEnd": 129
 },
 {
  "id": "samc",
  "abbr": "SAMC",
  "name": "Stochastic Approximation MCMC",
  "section": "4.22",
  "authors": "Liang & Zhang",
  "year": 2007,
  "tags": [
   "score",
   "bma"
  ],
  "basedOn": [
   "mc3"
  ],
  "pageStart": 130,
  "pageEnd": 132
 },
 {
  "id": "bb",
  "abbr": "B&B",
  "name": "Branch-and-Bound",
  "section": "4.23",
  "authors": "de Campos et al.",
  "year": 2009,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [],
  "pageStart": 133,
  "pageEnd": 136
 },
 {
  "id": "ebb",
  "abbr": "E-B&B",
  "name": "Extended Branch-and-Bound",
  "section": "4.24",
  "authors": "Etminani et al.",
  "year": 2010,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "bb"
  ],
  "pageStart": 137,
  "pageEnd": 140
 },
 {
  "id": "sf",
  "abbr": "SF",
  "name": "Structure-Finder",
  "section": "4.25",
  "authors": "Xu et al.",
  "year": 2011,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [],
  "pageStart": 141,
  "pageEnd": 143
 },
 {
  "id": "gobnilp",
  "abbr": "GOBNILP",
  "name": "Globally Optimal BN via ILP",
  "section": "4.26",
  "authors": "Cussens",
  "year": 2012,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "bblp"
  ],
  "pageStart": 144,
  "pageEnd": 151
 },
 {
  "id": "astar",
  "abbr": "A*",
  "name": "A* Search",
  "section": "4.27",
  "authors": "Yuan et al.",
  "year": 2011,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "optord"
  ],
  "pageStart": 152,
  "pageEnd": 154
 },
 {
  "id": "cfci",
  "abbr": "CFCI",
  "name": "Conservative FCI",
  "section": "4.28",
  "authors": "Colombo et al.",
  "year": 2012,
  "tags": [
   "constraint",
   "latent",
   "exact"
  ],
  "basedOn": [
   "fci",
   "cpc"
  ],
  "pageStart": 155,
  "pageEnd": 156
 },
 {
  "id": "rfci",
  "abbr": "RFCI",
  "name": "Really Fast Causal Inference",
  "section": "4.30",
  "authors": "Colombo et al.",
  "year": 2012,
  "tags": [
   "constraint",
   "latent"
  ],
  "basedOn": [
   "fci"
  ],
  "pageStart": 157,
  "pageEnd": 158
 },
 {
  "id": "jt",
  "abbr": "JT",
  "name": "Junction Tree",
  "section": "4.31",
  "authors": "Zhu et al.",
  "year": 2012,
  "tags": [
   "distributed"
  ],
  "basedOn": [],
  "pageStart": 159,
  "pageEnd": 162
 },
 {
  "id": "gies",
  "abbr": "GIES",
  "name": "Greedy Interventional Equivalence Search",
  "section": "4.32",
  "authors": "Hauser & Buhlmann",
  "year": 2012,
  "tags": [
   "score"
  ],
  "basedOn": [
   "ges"
  ],
  "pageStart": 163,
  "pageEnd": 165
 },
 {
  "id": "sada",
  "abbr": "SADA",
  "name": "Scalable Causation Discovery Algorithm",
  "section": "4.33",
  "authors": "Cai et al.",
  "year": 2013,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [],
  "pageStart": 166,
  "pageEnd": 171
 },
 {
  "id": "asp",
  "abbr": "ASP",
  "name": "Answer Set Programming formulation",
  "section": "4.34",
  "authors": "Hyttinen et al.",
  "year": 2014,
  "tags": [
   "hybrid",
   "exact"
  ],
  "basedOn": [],
  "pageStart": 172,
  "pageEnd": 174
 },
 {
  "id": "resit",
  "abbr": "RESIT",
  "name": "Regression with Subsequent Independence Test",
  "section": "4.35",
  "authors": "Peters et al.",
  "year": 2014,
  "tags": [
   "scm",
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 175,
  "pageEnd": 179
 },
 {
  "id": "cpbayes",
  "abbr": "CPBayes",
  "name": "Constraint Programming for BNs",
  "section": "4.36",
  "authors": "van Beek & Hoffmann",
  "year": 2015,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "optord",
   "obs"
  ],
  "pageStart": 180,
  "pageEnd": 183
 },
 {
  "id": "ila",
  "abbr": "ILA",
  "name": "Iterative Learning Automata",
  "section": "4.37",
  "authors": "Gheisari et al.",
  "year": 2016,
  "tags": [
   "score"
  ],
  "basedOn": [],
  "pageStart": 184,
  "pageEnd": 189
 },
 {
  "id": "ggsl",
  "abbr": "GGSL",
  "name": "Graph Growing Structure Learning",
  "section": "4.38",
  "authors": "Gao et al.",
  "year": 2017,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "orderedgs"
  ],
  "pageStart": 190,
  "pageEnd": 191
 },
 {
  "id": "sar",
  "abbr": "SAR",
  "name": "Separation And Reunion",
  "section": "4.39",
  "authors": "Liu et al.",
  "year": 2017,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [
   "sf"
  ],
  "pageStart": 192,
  "pageEnd": 196
 },
 {
  "id": "partitionmcmc",
  "abbr": "PartitionMCMC",
  "name": "Partition MCMC",
  "section": "4.40",
  "authors": "Kuipers & Moffa",
  "year": 2017,
  "tags": [
   "score",
   "bma"
  ],
  "basedOn": [
   "mc3",
   "rai"
  ],
  "pageStart": 197,
  "pageEnd": 200
 },
 {
  "id": "bap",
  "abbr": "BAP",
  "name": "Bow-free Acyclic Path diagrams",
  "section": "4.41",
  "authors": "Nowzohour et al.",
  "year": 2017,
  "tags": [
   "scm",
   "latent",
   "score"
  ],
  "basedOn": [],
  "pageStart": 201,
  "pageEnd": 206
 },
 {
  "id": "sp",
  "abbr": "SP",
  "name": "Sparsest Permutation",
  "section": "4.42",
  "authors": "Raskutti & Uhler",
  "year": 2018,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "obs"
  ],
  "pageStart": 207,
  "pageEnd": 209
 },
 {
  "id": "m3b",
  "abbr": "M3B",
  "name": "Mine MAG Markov Blanket",
  "section": "4.43",
  "authors": "Yu et al.",
  "year": 2018,
  "tags": [
   "constraint",
   "latent"
  ],
  "basedOn": [],
  "pageStart": 210,
  "pageEnd": 212
 },
 {
  "id": "notears",
  "abbr": "NOTEARS",
  "name": "Non-combinatorial Optimization (NOTEARS)",
  "section": "4.44",
  "authors": "Zheng et al.",
  "year": 2018,
  "tags": [
   "scm",
   "score"
  ],
  "basedOn": [],
  "pageStart": 213,
  "pageEnd": 215
 },
 {
  "id": "consistentpc",
  "abbr": "ConsistentPC",
  "name": "Consistent PC",
  "section": "4.45",
  "authors": "Li et al.",
  "year": 2019,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 216,
  "pageEnd": 218
 },
 {
  "id": "lol",
  "abbr": "LOL",
  "name": "Layered Optimal Learning",
  "section": "4.46",
  "authors": "Yu et al.",
  "year": 2019,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [],
  "pageStart": 219,
  "pageEnd": 225
 },
 {
  "id": "lfoica",
  "abbr": "LFOICA",
  "name": "Likelihood-Free Overcomplete ICA",
  "section": "4.47",
  "authors": "Ding et al.",
  "year": 2019,
  "tags": [
   "scm",
   "latent"
  ],
  "basedOn": [],
  "pageStart": 226,
  "pageEnd": 229
 },
 {
  "id": "liidm",
  "abbr": "LIIDM",
  "name": "Linear SEM IID-noise Discovery",
  "section": "4.48",
  "authors": "Xie et al.",
  "year": 2019,
  "tags": [
   "scm",
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 230,
  "pageEnd": 232
 },
 {
  "id": "mas",
  "abbr": "MAS",
  "name": "Maximum Acyclic Subgraph",
  "section": "4.49",
  "authors": "Gillot & Parviainen",
  "year": 2020,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "gobnilp"
  ],
  "pageStart": 233,
  "pageEnd": 235
 },
 {
  "id": "twoadjacency",
  "abbr": "2-adjacency",
  "name": "2-adjacency Faithfulness",
  "section": "4.50",
  "authors": "Marx et al.",
  "year": 2021,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "pc",
   "gs"
  ],
  "pageStart": 236,
  "pageEnd": 240
 },
 {
  "id": "alphabeta",
  "abbr": "α-β",
  "name": "α-β Collaborative Discovery",
  "section": "4.51",
  "authors": "Addanki & Kasiviswanathan",
  "year": 2021,
  "tags": [
   "constraint",
   "latent",
   "data-distributed"
  ],
  "basedOn": [
   "fci"
  ],
  "pageStart": 241,
  "pageEnd": 249
 },
 {
  "id": "gsp",
  "abbr": "GSP",
  "name": "Greedy Sparsest Permutation",
  "section": "4.52",
  "authors": "Solus et al.",
  "year": 2021,
  "tags": [
   "constraint",
   "score"
  ],
  "basedOn": [
   "sp",
   "hc"
  ],
  "pageStart": 250,
  "pageEnd": 253
 },
 {
  "id": "marvel",
  "abbr": "MARVEL",
  "name": "Markov-boundary Recursive Variable Elimination",
  "section": "4.53",
  "authors": "Mokhtarian et al.",
  "year": 2021,
  "tags": [
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 254,
  "pageEnd": 258
 },
 {
  "id": "camuv",
  "abbr": "CAMUV",
  "name": "Causal Additive Model w/ Unobserved Vars",
  "section": "4.54",
  "authors": "Maeda & Shimizu",
  "year": 2021,
  "tags": [
   "scm",
   "latent",
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 259,
  "pageEnd": 263
 },
 {
  "id": "avici",
  "abbr": "AVICI",
  "name": "Amortized Variational Inference for Causal Discovery",
  "section": "4.55",
  "authors": "Lorch et al.",
  "year": 2022,
  "tags": [
   "score"
  ],
  "basedOn": [],
  "pageStart": 264,
  "pageEnd": 267
 },
 {
  "id": "latentges",
  "abbr": "LatentGES",
  "name": "Latent Greedy Equivalence Search",
  "section": "4.56",
  "authors": "Claassen & Bucur",
  "year": 2022,
  "tags": [
   "latent",
   "score"
  ],
  "basedOn": [
   "ges",
   "fci"
  ],
  "pageStart": 268,
  "pageEnd": 272
 },
 {
  "id": "ahp",
  "abbr": "AHP",
  "name": "Ancestral/Heuristic Partition",
  "section": "4.57",
  "authors": "Tan et al.",
  "year": 2022,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "optord",
   "astar",
   "k2improved"
  ],
  "pageStart": 273,
  "pageEnd": 277
 },
 {
  "id": "dog",
  "abbr": "DOG",
  "name": "Direct Ordered Grouping",
  "section": "4.58",
  "authors": "Yang & Chen",
  "year": 2022,
  "tags": [
   "scm",
   "latent",
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 278,
  "pageEnd": 283
 },
 {
  "id": "cpbg",
  "abbr": "CPBG",
  "name": "Causal Partition Base Graph",
  "section": "4.59",
  "authors": "Hong et al.",
  "year": 2023,
  "tags": [
   "data-distributed"
  ],
  "basedOn": [
   "cp"
  ],
  "pageStart": 284,
  "pageEnd": 288
 },
 {
  "id": "cim",
  "abbr": "CIM",
  "name": "Characteristic Imset",
  "section": "4.60",
  "authors": "Linnusson et al.",
  "year": 2023,
  "tags": [
   "score",
   "hybrid"
  ],
  "basedOn": [
   "gsp"
  ],
  "pageStart": 289,
  "pageEnd": 291
 },
 {
  "id": "erda",
  "abbr": "ERDA",
  "name": "Efficient Recursive Decomposition Algorithm",
  "section": "4.61",
  "authors": "Jia et al.",
  "year": 2023,
  "tags": [
   "data-distributed"
  ],
  "basedOn": [
   "sar"
  ],
  "pageStart": 292,
  "pageEnd": 295
 },
 {
  "id": "decamfounder",
  "abbr": "DeCAMFounder",
  "name": "Deconfounder for Additive Models",
  "section": "4.62",
  "authors": "Agrawal et al.",
  "year": 2023,
  "tags": [
   "scm",
   "latent",
   "hybrid"
  ],
  "basedOn": [],
  "pageStart": 296,
  "pageEnd": 299
 },
 {
  "id": "cpa",
  "abbr": "CPA",
  "name": "Causal Partitioning (Adjoint)",
  "section": "4.63",
  "authors": "Zhang et al.",
  "year": 2024,
  "tags": [
   "data-distributed"
  ],
  "basedOn": [
   "cp"
  ],
  "pageStart": 300,
  "pageEnd": 303
 },
 {
  "id": "tat",
  "abbr": "TAT",
  "name": "Time-Approximation Trade-off",
  "section": "4.64",
  "authors": "Kundu et al.",
  "year": 2023,
  "tags": [
   "score",
   "approximate"
  ],
  "basedOn": [],
  "pageStart": 304,
  "pageEnd": 307
 },
 {
  "id": "fedges",
  "abbr": "FedGES",
  "name": "Federated GES",
  "section": "4.65",
  "authors": "Torrijos et al.",
  "year": 2025,
  "tags": [
   "score",
   "distributed"
  ],
  "basedOn": [
   "ges"
  ],
  "pageStart": 308,
  "pageEnd": 311
 },
 {
  "id": "defuse",
  "abbr": "DeFuSE",
  "name": "Deconfounded Functional Structure Estimation",
  "section": "4.66",
  "authors": "Li et al.",
  "year": 2024,
  "tags": [
   "scm",
   "latent",
   "constraint"
  ],
  "basedOn": [],
  "pageStart": 312,
  "pageEnd": 314
 },
 {
  "id": "fsbn",
  "abbr": "FSBN",
  "name": "Fast Search BN",
  "section": "4.67",
  "authors": "Minn & Shunkai",
  "year": 2023,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "pc"
  ],
  "pageStart": 315,
  "pageEnd": 317
 },
 {
  "id": "dagaf",
  "abbr": "DAGAF",
  "name": "Directed Acyclic Generative Adversarial Framework",
  "section": "4.68",
  "authors": "Petkov et al.",
  "year": 2025,
  "tags": [
   "scm",
   "score"
  ],
  "basedOn": [],
  "pageStart": 318,
  "pageEnd": 321
 },
 {
  "id": "hcmc",
  "abbr": "HCMC",
  "name": "Hill-Climber Monte Carlo",
  "section": "5.1",
  "authors": "Castelo & Kocka",
  "year": 2003,
  "tags": [
   "score",
   "bma"
  ],
  "basedOn": [
   "hc"
  ],
  "pageStart": 322,
  "pageEnd": 323
 },
 {
  "id": "iamb",
  "abbr": "IAMB",
  "name": "Incremental Association Markov Blanket",
  "section": "5.2",
  "authors": "Tsamardinos et al.",
  "year": 2003,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "gs"
  ],
  "pageStart": 324,
  "pageEnd": 326
 },
 {
  "id": "mmhc",
  "abbr": "MMHC",
  "name": "Max-Min Hill-Climbing",
  "section": "5.3",
  "authors": "Tsamardinos et al.",
  "year": 2006,
  "tags": [
   "hybrid"
  ],
  "basedOn": [
   "mmpc",
   "hc"
  ],
  "pageStart": 327,
  "pageEnd": 328
 },
 {
  "id": "ip",
  "abbr": "IP",
  "name": "Ideal Parent",
  "section": "5.4",
  "authors": "Elidan et al.",
  "year": 2007,
  "tags": [
   "scm",
   "hybrid"
  ],
  "basedOn": [],
  "pageStart": 329,
  "pageEnd": 332
 },
 {
  "id": "cos",
  "abbr": "COS",
  "name": "Constrained Optimal Search",
  "section": "5.5",
  "authors": "Perrier et al.",
  "year": 2008,
  "tags": [
   "hybrid",
   "exact"
  ],
  "basedOn": [
   "optord",
   "mmpc"
  ],
  "pageStart": 333,
  "pageEnd": 334
 },
 {
  "id": "bblp",
  "abbr": "BBLP",
  "name": "Branch-and-Bound with LP",
  "section": "5.6",
  "authors": "Jaakkola et al.",
  "year": 2010,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [],
  "pageStart": 335,
  "pageEnd": 339
 },
 {
  "id": "orderedgs",
  "abbr": "OrderedGS",
  "name": "Ordered Grow-Shrink",
  "section": "5.7",
  "authors": "Bromberg et al.",
  "year": 2009,
  "tags": [
   "constraint"
  ],
  "basedOn": [
   "gs",
   "mmpc"
  ],
  "pageStart": 340,
  "pageEnd": 342
 },
 {
  "id": "ecos",
  "abbr": "ECOS",
  "name": "Extended Constrained Optimal Search",
  "section": "5.8",
  "authors": "Kojima et al.",
  "year": 2010,
  "tags": [
   "distributed",
   "exact"
  ],
  "basedOn": [
   "cos"
  ],
  "pageStart": 343,
  "pageEnd": 348
 },
 {
  "id": "pcb",
  "abbr": "PCB",
  "name": "Partial Correlation-Based",
  "section": "5.9",
  "authors": "Yang et al.",
  "year": 2011,
  "tags": [
   "hybrid"
  ],
  "basedOn": [
   "mmhc"
  ],
  "pageStart": 349,
  "pageEnd": 350
 },
 {
  "id": "asobs",
  "abbr": "ASOBS",
  "name": "Acyclic Selection OBS",
  "section": "5.10",
  "authors": "Scanagatta et al.",
  "year": 2015,
  "tags": [
   "score"
  ],
  "basedOn": [
   "obs"
  ],
  "pageStart": 351,
  "pageEnd": 353
 },
 {
  "id": "inobs",
  "abbr": "INOBS",
  "name": "Neighborhood OBS",
  "section": "5.11",
  "authors": "Lee & van Beek",
  "year": 2017,
  "tags": [
   "score"
  ],
  "basedOn": [
   "obs"
  ],
  "pageStart": 354,
  "pageEnd": 355
 },
 {
  "id": "winasobs",
  "abbr": "WINASOBS",
  "name": "Window ASOBS",
  "section": "5.12",
  "authors": "Scanagatta et al.",
  "year": 2018,
  "tags": [
   "score"
  ],
  "basedOn": [
   "inobs",
   "asobs"
  ],
  "pageStart": 356,
  "pageEnd": 357
 },
 {
  "id": "gobnilpdev",
  "abbr": "GOBNILP-dev",
  "name": "Deviation-bounded GOBNILP",
  "section": "5.13",
  "authors": "Liao et al.",
  "year": 2019,
  "tags": [
   "score",
   "exact"
  ],
  "basedOn": [
   "gobnilp"
  ],
  "pageStart": 357,
  "pageEnd": 358
 },
 {
  "id": "cp",
  "abbr": "CP",
  "name": "Causal Partitioning",
  "section": "5.14",
  "authors": "Yan & Zhou",
  "year": 2020,
  "tags": [
   "constraint",
   "data-distributed"
  ],
  "basedOn": [
   "pc",
   "sada"
  ],
  "pageStart": 358,
  "pageEnd": 362
 },
 {
  "id": "k2improved",
  "abbr": "K2Improved",
  "name": "K2 Improved",
  "section": "5.15",
  "authors": "Behjati & Beigy",
  "year": 2020,
  "tags": [
   "score",
   "hybrid"
  ],
  "basedOn": [
   "k2",
   "rai"
  ],
  "pageStart": 363,
  "pageEnd": 364
 },
 {
  "id": "localdsla",
  "abbr": "LocalDSLA",
  "name": "Local Decomposition Structure Learning",
  "section": "5.16",
  "authors": "Dai et al.",
  "year": 2020,
  "tags": [
   "constraint",
   "distributed"
  ],
  "basedOn": [
   "ecos"
  ],
  "pageStart": 365,
  "pageEnd": 368
 },
 {
  "id": "pewobs",
  "abbr": "PEWOBS",
  "name": "Permutation and Extensible Ordering-Based Search",
  "section": "5.17",
  "authors": "Xu et al.",
  "year": 2021,
  "tags": [
   "score"
  ],
  "basedOn": [
   "winasobs"
  ],
  "pageStart": 369,
  "pageEnd": 370
 },
 {
  "id": "other",
  "abbr": "Other",
  "name": "Other algorithms (brief)",
  "section": "5.18",
  "authors": "various",
  "year": 2025,
  "tags": [],
  "basedOn": [],
  "pageStart": 371,
  "pageEnd": 414
 }
];
