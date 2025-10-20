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
      dataSource
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
  }
`;
