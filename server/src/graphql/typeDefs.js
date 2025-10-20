const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type ServiceType {
    name: String!
    uri: String
  }

  type ValidityPeriod {
    fromDate: String
    toDate: String
    isNow: Boolean
  }

  type LineStatusDetail {
    id: ID!
    statusSeverity: Int
    statusSeverityDescription: String
    reason: String
    created: String
    validityPeriods: [ValidityPeriod!]!
  }

  type LineStatus {
    id: ID!
    name: String!
    modeName: String!
    serviceTypes: [ServiceType!]!
    statuses: [LineStatusDetail!]!
    disruptions: [Disruption!]!
  }

  type ArrivalPrediction {
    id: ID!
    lineId: String!
    lineName: String!
    platformName: String
    direction: String
    stationName: String
    currentLocation: String
    destinationName: String
    expectedArrival: String
    timeToStation: Int
    towards: String
  }

  type Disruption {
    lineId: String
    category: String
    type: String
    description: String
    summary: String
    additionalInfo: String
    created: String
    lastUpdate: String
  }

  type StopPoint {
    id: ID!
    name: String
    lat: Float
    lon: Float
    indicator: String
    stopType: String
    modes: [String!]!
    zone: String
  }

  type SeverityCount {
    severity: String!
    count: Int!
  }

  type LineSummary {
    id: ID!
    name: String!
    modeName: String!
    statusSeverity: Int
    statusSeverityDescription: String
    reason: String
    activeDisruptions: Int!
  }

  type LineSpreadEntry {
    lineName: String!
    count: Int!
  }

  type ArrivalInsight {
    stopPointId: ID!
    stopName: String
    soonestArrival: String
    averageWait: Int
    platforms: [String!]!
    lineSpread: [LineSpreadEntry!]!
  }

  type InsightSnapshot {
    generatedAt: String!
    severityBreakdown: [SeverityCount!]!
    lineSummaries: [LineSummary!]!
    arrivals: [ArrivalInsight!]!
    disruptions: [Disruption!]!
  }

  type Query {
    lineStatuses(mode: String!): [LineStatus!]!
    arrivals(stopPointId: ID!, lineIds: [ID!]): [ArrivalPrediction!]!
    disruptions(mode: String!): [Disruption!]!
    stopPointsByLine(lineId: ID!): [StopPoint!]!
    insightSnapshot(mode: String!, stopPointIds: [ID!]): InsightSnapshot!
  }
`;

module.exports = typeDefs;
