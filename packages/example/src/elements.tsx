import styled from '@emotion/styled'

export const RoomWrapper = styled.div`
  padding: 30px;
  border-bottom: 2px solid #e8e8e8;
`

export const H4 = styled.h4`
  margin: 0;
  padding-right: 10px;
`

export const Input = styled.input`
  padding: 6px 14px;
  font-size: 14px;
  margin-right: 10px;
  min-width: 240px;
  outline: none;
  border: 2px solid palevioletred;
  & + button {
    margin-left: auto;
  }
`

export const Button = styled.button`
  padding: 6px 14px;
  display: block;
  outline: none;
  font-size: 14px;
  text-align: center;
  color: palevioletred;
  white-space: nowrap;
  border: 2px solid palevioletred;
  & + button {
    margin-left: 10px;
  }
`

export const IconButton = styled(Button)((props: any) => ({
  color: props.active ? 'mediumvioletred' : 'lightpink',
  border: 'none',
  padding: 0
}))

export const Icon = styled.div``

export const Grid = styled.div`
  display: grid;
  grid-gap: 2vw;
  grid-template-columns: 1fr 1fr;
`

export const Title = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`

export const Instance = styled.div<{ online: boolean }>`
  background: ${props =>
    props.online ? 'rgba(128, 128, 128, 0.1)' : 'rgba(247, 0, 0, 0.2)'};
  padding: 20px 30px 40px;
`

export const ClientFrame = styled.div`
  box-shadow: 2px 2px 4px rgba(128, 128, 128, 0.2);
  padding: 10px;
  min-height: 70px;
  margin-left: -10px;
  margin-right: -10px;
  background: white;
  blockquote {
    border-left: 2px solid #ddd;
    margin-left: 0;
    margin-right: 0;
    padding-left: 10px;
    color: #aaa;
    font-style: italic;
  }
`
