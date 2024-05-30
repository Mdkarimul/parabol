import {sql} from 'kysely'
import TeamPromptResponseId from 'parabol-client/shared/gqlIds/TeamPromptResponseId'
import {SubscriptionChannel, Threshold} from 'parabol-client/types/constEnums'
import {ValueOf} from 'parabol-client/types/generics'
import toTeamMemberId from 'parabol-client/utils/relay/toTeamMemberId'
import getRethink from '../../../database/rethinkDriver'
import {RDatum} from '../../../database/stricterR'
import Comment from '../../../database/types/Comment'
import {Reactable} from '../../../database/types/Reactable'
import Reflection from '../../../database/types/Reflection'
import getKysely from '../../../postgres/getKysely'
import {analytics} from '../../../utils/analytics/analytics'
import {getUserId} from '../../../utils/authorization'
import emojiIds from '../../../utils/emojiIds'
import getGroupedReactjis from '../../../utils/getGroupedReactjis'
import publish from '../../../utils/publish'
import {GQLContext} from '../../graphql'
import {ReactableEnumType} from '../../types/ReactableEnum'
import getReactableType from '../../types/getReactableType'
import {MutationResolvers} from '../resolverTypes'

const rethinkTableLookup = {
  COMMENT: 'Comment',
  REFLECTION: 'RetroReflection'
} as const

const pgDataloaderLookup = {
  RESPONSE: 'teamPromptResponses'
} as const

const addReactjiToReactable: MutationResolvers['addReactjiToReactable'] = async (
  _source: unknown,
  {
    reactableId,
    reactableType,
    reactji,
    isRemove,
    meetingId
  }: {
    reactableId: string
    reactableType: ReactableEnumType
    reactji: string
    isRemove?: boolean | null
    meetingId: string
  },
  {authToken, dataLoader, socketId: mutatorId}: GQLContext
) => {
  const r = await getRethink()
  const pg = getKysely()
  const viewerId = getUserId(authToken)
  const now = new Date()
  const operationId = dataLoader.share()
  const subOptions = {mutatorId, operationId}

  //AUTH
  let reactable: Reactable
  const pgLoaderName = pgDataloaderLookup[
    reactableType as keyof typeof pgDataloaderLookup
  ] as ValueOf<typeof pgDataloaderLookup> | null
  const rethinkDbTable = rethinkTableLookup[reactableType as keyof typeof rethinkTableLookup]
  if (pgLoaderName) {
    reactable = await dataLoader.get(pgLoaderName).loadNonNull(reactableId)
  } else {
    reactable = (await r.table(rethinkDbTable).get(reactableId).run()) as Reactable
  }
  if (!reactable) {
    return {error: {message: `Item does not exist`}}
  }
  const {reactjis} = reactable
  const verifiedType = getReactableType(reactable)
  if (verifiedType !== reactableType) {
    return {error: {message: `Unknown item`}}
  }
  const meetingMemberId = toTeamMemberId(meetingId, viewerId)
  const [viewerMeetingMember, viewer] = await Promise.all([
    dataLoader.get('meetingMembers').load(meetingMemberId),
    dataLoader.get('users').loadNonNull(viewerId)
  ])
  if (!viewerMeetingMember) {
    return {error: {message: `Not a member of the meeting`}}
  }

  // VALIDATION
  if (!emojiIds.includes(reactji)) {
    return {error: {message: `invalid emoji`}}
  }

  if (!isRemove) {
    const groupedReactjis = getGroupedReactjis(reactjis, viewerId, reactableId)
    const nextReactjiId = `${reactableId}:${reactji}`
    const isReactjiPresent = !!groupedReactjis.find((agg) => agg.id === nextReactjiId)
    if (!isReactjiPresent && groupedReactjis.length >= Threshold.MAX_REACTJIS) {
      return {error: {message: `Reactji limit reached`}}
    }
  }

  // RESOLUTION
  const subDoc = {id: reactji, userId: viewerId}
  if (pgLoaderName) {
    const numberReactableId = TeamPromptResponseId.split(reactableId)
    if (isRemove) {
      await pg
        .updateTable('TeamPromptResponse')
        .set({reactjis: sql`array_remove("reactjis", (${reactji},${viewerId})::"Reactji")`})
        .where('id', '=', numberReactableId)
        .execute()
    } else {
      await pg
        .updateTable('TeamPromptResponse')
        .set({
          reactjis: sql`arr_append_uniq("reactjis", (${reactji},${viewerId})::"Reactji")`
        })
        .where('id', '=', numberReactableId)
        .execute()
    }

    dataLoader.get(pgLoaderName).clear(reactableId)
  } else {
    if (isRemove) {
      await r
        .table(rethinkDbTable)
        .get(reactableId)
        .update((row: RDatum<Comment | Reflection>) => ({
          reactjis: row('reactjis').difference([subDoc]),
          updatedAt: now
        }))
        .run()
    } else {
      await r
        .table(rethinkDbTable)
        .get(reactableId)
        .update((row: RDatum<Comment | Reflection>) => ({
          reactjis: r.branch(
            row('reactjis').contains(subDoc),
            row('reactjis'),
            // don't use distinct, it sorts the fields
            row('reactjis').append(subDoc)
          ),
          updatedAt: now
        }))
        .run()
    }
  }

  const meeting = await dataLoader.get('newMeetings').load(meetingId)
  const {meetingType} = meeting

  const data = {reactableId, reactableType}

  analytics.reactjiInteracted(
    viewer,
    meetingId,
    meetingType,
    reactable,
    reactableType,
    reactji,
    !!isRemove
  )
  if (meetingId) {
    publish(
      SubscriptionChannel.MEETING,
      meetingId,
      'AddReactjiToReactableSuccess',
      data,
      subOptions
    )
  }
  return data
}

export default addReactjiToReactable
