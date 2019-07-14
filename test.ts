// tests go here; this will not be compiled when this package is used as a library
/**
  * Enumeration of Move.
  */
enum DKBOTMove {
    //% block="Forward \u21c8"
    Forward,
    //% block="Backward \u21ca"
    Backward
}

enum DKBOTMotorCH {
    //% block="1"
    M1,
    //% block="2"
    M2
}

/**
 * Custom blocks /f23c monster /f2d6 นักบินอวกาศ /f2dd
 */
//% weight=100 color=#000000 icon="\uf23c"
namespace DKBOT {

    let sensorsRead: number[] = []
    let valSensorsMin: number[] = []
    let valSensorsMax: number[] = []
    let numSensors = 0
    let numSensorsLoop = 0

    let maxSpeed = 0
    let error = 0
    let lastError = 0

    /**ตั้งค่าเริ่มต้น จำนวนเซนเซอร์, ความเร็วสูงสุดของมอเตอร์   
      * @param numSensors percent of maximum numSensors, eg: 5
      * @param maxSpeed percent of maximum maxSpeed, eg: 100
      */
    //% blockId="DKBOT_dkbotStart" block="dkbotStart | numSensors %Sensors"
    //% Speed.min=0 Speed.max=100
    //% weight=100
    export function dkbotStart(numSensors: number): void {
        numSensorsLoop = numSensors - 1
        for (let n = 0; n <= numSensorsLoop; n++) {
            valSensorsMin[n] = 1023
            valSensorsMax[n] = 0
        }
    }

    /** มอเตอร์เคลื่อนที่เลี้ยว 90 องศา
         * @param speed describe speed here, eg: 60
         */
    //% blockId="DKBOT_Move" block="Move | Motor %Motor  | Speed %speed | Direction %Direction"
    //% weight=70
    export function Move(motor: DKBOTMotorCH, speed: number, direction: DKBOTMove) {
        if (direction == DKBOTMove.Forward) {
            if (motor == DKBOTMotorCH.M1) {
                iBIT.setMotor(ibitMotorCH.M1, ibitMotor.Forward, speed)
            }
            if (motor == DKBOTMotorCH.M2) {
                iBIT.setMotor(ibitMotorCH.M2, ibitMotor.Forward, speed)
            }
        }
        if (direction == DKBOTMove.Backward) {
            if (motor == DKBOTMotorCH.M1) {
                iBIT.setMotor(ibitMotorCH.M1, ibitMotor.Backward, speed)
            }
            if (motor == DKBOTMotorCH.M2) {
                iBIT.setMotor(ibitMotorCH.M2, ibitMotor.Backward, speed)
            }
        }
    }

    function readSensors() {
        sensorsRead[0] = pins.analogReadPin(AnalogPin.P0)
        sensorsRead[1] = pins.analogReadPin(AnalogPin.P1)
        sensorsRead[2] = pins.analogReadPin(AnalogPin.P2)
    }

    //% blockId="DKBOT_caribrateSensors" block="caribrateSensors"
    //% weight=90
    export function caribrateSensors(): void {
        readSensors()
        for (let x = 0; x <= numSensorsLoop; x++) {
            if (sensorsRead[x] < valSensorsMin[x]) {
                valSensorsMin[x] = sensorsRead[x]
            }
            if (sensorsRead[x] > valSensorsMax[x]) {
                valSensorsMax[x] = sensorsRead[x]
            }
        }
    }

    //% blockId="DKBOT_readLine" block="readLine"
    //% weight=80
    export function readLine(): number {
        let on_line = 0
        let last_value = 0
        let avg = 0
        let sum = 0
        readCalibrated()
        avg = 0
        sum = 0
        for (let k = 0; k <= numSensorsLoop; k++) {
            let valReadLine = sensorsRead[k]
            if (valReadLine > 200) {
                on_line = 1
            }
            if (valReadLine > 50) {
                avg = avg + valReadLine * (k * 1000)
                sum = sum + valReadLine
            }
        }

        if (on_line == 0) {
            if (last_value < numSensorsLoop * 1000 / 2) {
                return 0
            } else {
                return numSensorsLoop * 1000
            }
        }
        last_value = avg / sum
        return last_value
    }

    /** หาค่าความเร็วมอเตอร์โดยใช้สมการ PID
         * @param line describe line here, eg: 0
         * @param kp describe kp here, eg: 1.8
         * @param kd describe kd here, eg: 15
         */
    //% blockId="DKBOT_powerMotor" block="powerMotor | line %line  | kp %kp | kd %kd"
    //% weight=80
    function powerMotor(line: number, kp: number, kd: number): number {
        let power_diff = 0
        positionValue = line
        error = Math.map(positionValue, 0, 2000, 0, 200) - 100
        power_diff = KP * error + KD * (error - lastError)
        lastError = error
        if (power_diff > maxSpeed) {
            power_diff = maxSpeed
        }
        if (power_diff < 0 - maxSpeed) {
            power_diff = 0 - maxSpeed
        }
        return power_diff
    }

    function readCalibrated() {
        readSensors()
        for (let z = 0; z <= numSensorsLoop; z++) {
            let calmin = 0
            let calmax = 0
            let denominator = 0
            calmax = valSensorsMax[z]
            calmin = valSensorsMin[z]
            denominator = calmax - calmin
            let calVal = 0
            if (denominator != 0) {
                calVal = (sensorsRead[z] - calmin) * 1000 / denominator
            }
            if (calVal < 0) {
                calVal = 0
            } else if (calVal > 1000) {
                calVal = 1000
            }
            sensorsRead[z] = calVal
        }
    }
}
