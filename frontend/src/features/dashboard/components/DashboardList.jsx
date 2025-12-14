import { useTheme } from "@emotion/react"
import { Stack, Typography, useMediaQuery } from "@mui/material"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { motion } from 'framer-motion'



export const DashboardList = () => {
    const theme = useTheme()

    const is1200 = useMediaQuery(theme.breakpoints.down(1200))
    const is800 = useMediaQuery(theme.breakpoints.down(800))
    const is700 = useMediaQuery(theme.breakpoints.down(700))
    const is600 = useMediaQuery(theme.breakpoints.down(600))
    const is500 = useMediaQuery(theme.breakpoints.down(500))
    const is488 = useMediaQuery(theme.breakpoints.down(488))

    const dispatch = useDispatch()

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "instant"
        })
    }, [])

    return (
        <>
            <Stack>
                Dashboard
            </Stack>
        </>
    )
}