import {RevealReason} from '../models/RevealReason';

export const ReasonMessage: {[key: string]: string} = {
    [RevealReason.HostLeave]: "Host left!",
    [RevealReason.TimeOut]: "Time is up!",
    [RevealReason.AllGuessed]: "Everyone guessed the word!",
    [RevealReason.DrawerLeave]: "Drawer left!",
    [RevealReason.NotEnoughPlayers]: "Not enough players!",
    [RevealReason.ConnectionError]: "Connection error occured!",
    [RevealReason.UnexpectedError]: "Unexpected error occured!"
}
