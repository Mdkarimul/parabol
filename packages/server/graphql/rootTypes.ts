import IntegrationProviderOAuth1 from './types/IntegrationProviderOAuth1'
import IntegrationProviderOAuth2 from './types/IntegrationProviderOAuth2'
import IntegrationProviderSharedSecret from './types/IntegrationProviderSharedSecret'
import IntegrationProviderWebhook from './types/IntegrationProviderWebhook'
import JiraDimensionField from './types/JiraDimensionField'
import RenamePokerTemplatePayload from './types/RenamePokerTemplatePayload'
import SetMeetingSettingsPayload from './types/SetMeetingSettingsPayload'
import TimelineEventCompletedActionMeeting from './types/TimelineEventCompletedActionMeeting'
import TimelineEventCompletedRetroMeeting from './types/TimelineEventCompletedRetroMeeting'
import TimelineEventJoinedParabol from './types/TimelineEventJoinedParabol'
import TimelineEventPokerComplete from './types/TimelineEventPokerComplete'
import TimelineEventTeamCreated from './types/TimelineEventTeamCreated'
import UserTiersCount from './types/UserTiersCount'

const rootTypes = [
  IntegrationProviderOAuth1,
  IntegrationProviderOAuth2,
  IntegrationProviderSharedSecret,
  IntegrationProviderWebhook,
  SetMeetingSettingsPayload,
  TimelineEventTeamCreated,
  TimelineEventJoinedParabol,
  TimelineEventCompletedRetroMeeting,
  TimelineEventCompletedActionMeeting,
  TimelineEventPokerComplete,
  JiraDimensionField,
  RenamePokerTemplatePayload,
  UserTiersCount
]
export default rootTypes
