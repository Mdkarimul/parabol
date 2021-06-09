import React from 'react'
import styled from '@emotion/styled'
import DialogTitle from './DialogTitle'
import AuthenticationDialog from './AuthenticationDialog'
import useRouter from '../hooks/useRouter'
import {ForgotPasswordResType} from '../types/constEnums'
import GoogleOAuthButtonBlock from './GoogleOAuthButtonBlock'
import {PALETTE} from '../styles/paletteV3'
import PlainButton from './PlainButton/PlainButton'
import PrimaryButton from './PrimaryButton'
import IconLabel from './IconLabel'
import {AuthPageSlug, GotoAuthPage} from './GenericAuthentication'
import {emailLinkStyle} from '../modules/email/styles'

const P = styled('p')({
  fontSize: 14,
  lineHeight: 1.5,
  margin: '16px 0',
  textAlign: 'center'
})

const ButtonWrapper = styled('div')({
  paddingTop: 8
})

const Container = styled('div')({
  margin: '0 auto',
  maxWidth: 240,
  width: '100%'
})

const LinkButton = styled(PlainButton)({
  color: PALETTE.SKY_500,
  ':hover': {
    color: PALETTE.SKY_500,
    textDecoration: 'underline'
  }
})

const StyledPrimaryButton = styled(PrimaryButton)({
  margin: '16px auto 0',
  width: 240
})

type TextField = {
  title: string
  descriptionOne: string | JSX.Element
  descriptionTwo: string | JSX.Element
  button: JSX.Element
}
type CopyType = Record<ForgotPasswordResType, TextField>

interface Props {
  gotoPage: GotoAuthPage
}

const SubmittedForgotPasswordPage = (props: Props) => {
  const {gotoPage} = props
  const {match, location} = useRouter<{token: string}>()
  const params = new URLSearchParams(location.search)
  const forgotPasswordResType = params.get('type') || ForgotPasswordResType.SUCCESS
  const email = params.get('email')
  const {token} = match.params
  const contactSupportCopy = (
    <>
      <a href={'mailto:love@parabol.co'} style={emailLinkStyle} title={'love@parabol.co'}>
        {'click here '}
      </a>
      {'to contact support.'}
    </>
  )

  const handleGoToPage = (page: AuthPageSlug, email: string | null) => {
    email ? gotoPage(page, `?email=${email}`) : gotoPage(page)
  }

  const copyTypes = {
    goog: {
      title: 'Oops!',
      descriptionOne: 'It looks like you may have signed-up with Gmail.',
      descriptionTwo: (
        <>
          {`Try signing in with Google or `}
          {contactSupportCopy}
        </>
      ),
      button: (
        <ButtonWrapper>
          <GoogleOAuthButtonBlock isCreate={false} invitationToken={token} />
        </ButtonWrapper>
      )
    },
    saml: {
      title: 'Oops!',
      descriptionOne: 'It looks like you may have signed-up using SSO.',
      descriptionTwo: (
        <>
          {`Try signing in with SSO or `}
          {contactSupportCopy}
        </>
      ),
      button: (
        <StyledPrimaryButton onClick={() => handleGoToPage('signin', null)} size='medium'>
          <IconLabel icon='arrow_back' label='Sign In with SSO' />
        </StyledPrimaryButton>
      )
    },
    success: {
      title: 'You’re all set!',
      descriptionOne: 'We’ve sent you an email with password recovery instructions.',
      descriptionTwo: (
        <>
          {'Didn’t get it? Check your spam folder, or '}
          <LinkButton onClick={() => handleGoToPage('forgot-password', email)}>
            click here
          </LinkButton>
          {' to try again.'}
        </>
      ),
      button: (
        <StyledPrimaryButton onClick={() => handleGoToPage('signin', email)} size='medium'>
          <IconLabel icon='arrow_back' label='Back to Sign In' />
        </StyledPrimaryButton>
      )
    }
  } as CopyType
  const copy = copyTypes[forgotPasswordResType]

  return (
    <AuthenticationDialog>
      <DialogTitle>{copy.title}</DialogTitle>
      <Container>
        <P>{copy.descriptionOne}</P>
        <P>{copy.descriptionTwo}</P>
        {copy.button}
      </Container>
    </AuthenticationDialog>
  )
}

export default SubmittedForgotPasswordPage
