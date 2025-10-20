import { gql } from '@apollo/client/core';

export const DASHBOARD_QUERY = gql`
  query Dashboard($mode: String!, $stopPointIds: [ID!]) {
    lineStatuses(mode: $mode) {
      id
      name
      modeName
      serviceTypes {
        name
      }
      statuses {
        id
        statusSeverity
        statusSeverityDescription
        reason
        created
        validityPeriods {
          fromDate
          toDate
          isNow
        }
      }
      disruptions {
        lineId
        category
        description
        summary
        additionalInfo
        created
        lastUpdate
      }
    }
    insightSnapshot(mode: $mode, stopPointIds: $stopPointIds) {
      generatedAt
      severityBreakdown {
        severity
        count
      }
      lineSummaries {
        id
        name
        modeName
        statusSeverity
        statusSeverityDescription
        reason
        activeDisruptions
      }
      arrivals {
        stopPointId
        stopName
        soonestArrival
        averageWait
        platforms
        lineSpread {
          lineName
          count
        }
      }
      disruptions {
        lineId
        category
        description
        summary
        additionalInfo
        created
        lastUpdate
      }
    }
  }
`;
