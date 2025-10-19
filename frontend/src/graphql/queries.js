import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query Dashboard($assetLimit: Int!) {
    marketSummary {
      totalMarketCapUsd
      totalVolumeUsd24Hr
      averageChangePercent24Hr
      assetsTracked
      positiveChangeCount
      negativeChangeCount
      lastUpdated
    }
    topMovers(limit: $assetLimit) {
      gainers {
        id
        symbol
        name
        priceUsd
        changePercent24Hr
        marketCapUsd
        volumeUsd24Hr
      }
      losers {
        id
        symbol
        name
        priceUsd
        changePercent24Hr
        marketCapUsd
        volumeUsd24Hr
      }
    }
    changeDistribution {
      label
      count
    }
    dominance(limit: 6) {
      assetId
      symbol
      dominancePercent
    }
    velocity {
      averageVelocityPercent
      sampleSize
    }
  }
`;

export const ASSETS_TABLE_QUERY = gql`
  query AssetsTable($limit: Int!, $offset: Int!) {
    assets(limit: $limit, offset: $offset) {
      id
      rank
      symbol
      name
      priceUsd
      changePercent24Hr
      marketCapUsd
      volumeUsd24Hr
      supply
      maxSupply
      vwap24Hr
      history {
        timestamp
        priceUsd
      }
    }
  }
`;
