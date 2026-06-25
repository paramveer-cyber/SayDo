"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CatLoader() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const ctx = gsap.context(() => {
      const everything = svg.querySelector<SVGGElement>("#Everything");
      const ground = svg.querySelector<SVGLineElement>("#ground");
      const frontLeg1 = svg.querySelector<SVGPathElement>("#front-leg-1");
      const frontLeg2 = svg.querySelector<SVGPathElement>("#front-leg-2");
      const backLeg1 = svg.querySelector<SVGPathElement>("#back-leg-1");
      const backLeg2 = svg.querySelector<SVGPathElement>("#back-leg-2");
      const tail = svg.querySelector<SVGPathElement>("#tail");
      const face = svg.querySelector<SVGGElement>("#Face");
      const leftEar = svg.querySelector<SVGGElement>("#Left_Ear");
      const rightEar = svg.querySelector<SVGGElement>("#Right_Ear");
      const whiskers = svg.querySelector<SVGGElement>("#Whiskers");
      const leftLidTop = svg.querySelector<SVGRectElement>("#left-lid-top");
      const leftLidBot = svg.querySelector<SVGRectElement>("#left-lid-bot");
      const rightLidTop = svg.querySelector<SVGRectElement>("#right-lid-top");
      const rightLidBot = svg.querySelector<SVGRectElement>("#right-lid-bot");

      const bd = 0.4;

      gsap.to(everything, {
        y: -14,
        duration: bd,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(ground, {
        scaleX: 0.6,
        svgOrigin: "285 360",
        duration: bd,
        ease: "sine.in",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(frontLeg1, {
        rotation: 20,
        svgOrigin: "225 260",
        duration: bd,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(frontLeg2, {
        rotation: -20,
        svgOrigin: "340 260",
        duration: bd,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: bd,
      });

      gsap.to(backLeg1, {
        rotation: -20,
        svgOrigin: "225 260",
        duration: bd,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: bd,
      });

      gsap.to(backLeg2, {
        rotation: 20,
        svgOrigin: "340 260",
        duration: bd,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(tail, {
        rotation: 18,
        svgOrigin: "208 240",
        duration: 0.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      const lookDur = 1.5;

      const lookTl = gsap.timeline({ repeat: -1, delay: 0.5 });
      lookTl
        .to(face, { x: -8, duration: lookDur, ease: "sine.inOut" })
        .to(face, { x: 0, duration: 0.7, ease: "sine.out" })
        .to(face, { x: 0, duration: 0.8 })
        .to(face, { x: 8, duration: lookDur, ease: "sine.inOut" })
        .to(face, { x: 0, duration: 0.7, ease: "sine.out" })
        .to(face, { x: 0, duration: 1.0 });

      const leftEarTl = gsap.timeline({ repeat: -1, delay: 0.5 });
      leftEarTl
        .to(leftEar, {
          rotation: -9,
          y: 3,
          svgOrigin: "316 160",
          duration: lookDur,
          ease: "sine.inOut",
        })
        .to(leftEar, { rotation: 0, y: 0, duration: 0.7, ease: "sine.out" })
        .to(leftEar, { rotation: 0, y: 0, duration: 0.8 })
        .to(leftEar, {
          rotation: 7,
          y: 3,
          duration: lookDur,
          ease: "sine.inOut",
        })
        .to(leftEar, { rotation: 0, y: 0, duration: 0.7, ease: "sine.out" })
        .to(leftEar, { rotation: 0, y: 0, duration: 1.0 });

      const rightEarTl = gsap.timeline({ repeat: -1, delay: 0.5 });
      rightEarTl
        .to(rightEar, {
          rotation: 9,
          y: 3,
          svgOrigin: "387 160",
          duration: lookDur,
          ease: "sine.inOut",
        })
        .to(rightEar, { rotation: 0, y: 0, duration: 0.7, ease: "sine.out" })
        .to(rightEar, { rotation: 0, y: 0, duration: 0.8 })
        .to(rightEar, {
          rotation: -7,
          y: 3,
          duration: lookDur,
          ease: "sine.inOut",
        })
        .to(rightEar, { rotation: 0, y: 0, duration: 0.7, ease: "sine.out" })
        .to(rightEar, { rotation: 0, y: 0, duration: 1.0 });

      const buildBlink = (
        topLid: SVGRectElement | null,
        botLid: SVGRectElement | null,
        startDelay: number,
      ) => {
        const tl = gsap.timeline({ repeat: -1, delay: startDelay });
        tl.to({}, { duration: 2.8 })
          .to(topLid, { y: 13, duration: 0.06, ease: "steps(1)" })
          .to(botLid, { y: -13, duration: 0.06, ease: "steps(1)" }, "<")
          .to(
            whiskers,
            {
              rotation: 7,
              svgOrigin: "364 182",
              duration: 0.08,
              ease: "back.out(2)",
            },
            "<",
          )
          .to(topLid, { y: 0, duration: 0.15, ease: "sine.out" })
          .to(botLid, { y: 0, duration: 0.15, ease: "sine.out" }, "<")
          .to(whiskers, { rotation: 0, duration: 0.18, ease: "sine.out" }, "<");
      };

      buildBlink(leftLidTop, leftLidBot, 0.3);
      buildBlink(rightLidTop, rightLidBot, 0.3);
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        ref={svgRef}
        id="Cat"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 400"
        style={{ width: "250px", height: "auto" }}
      >
        <line
          id="ground"
          x1="160"
          y1="360"
          x2="410"
          y2="360"
          style={{
            fill: "none",
            stroke: "#e2e2f2",
            strokeLinecap: "round",
            strokeMiterlimit: 10,
            strokeWidth: "16px",
          }}
        />

        <g id="Everything">
          <g id="Back_Legs">
            <path
              id="back-leg-1"
              d="M225,260v78"
              style={{
                fill: "none",
                stroke: "#c8852a",
                strokeLinecap: "round",
                strokeWidth: "26px",
              }}
            />
            <path
              id="back-leg-2"
              d="M340,260v78"
              style={{
                fill: "none",
                stroke: "#c8852a",
                strokeLinecap: "round",
                strokeWidth: "26px",
              }}
            />
          </g>

          <g id="Front_Legs">
            <path
              id="front-leg-1"
              d="M225,260v78"
              style={{
                fill: "none",
                stroke: "#eba13d",
                strokeLinecap: "round",
                strokeWidth: "28px",
              }}
            />
            <path
              id="front-leg-2"
              d="M340,260v78"
              style={{
                fill: "none",
                stroke: "#eba13d",
                strokeLinecap: "round",
                strokeWidth: "28px",
              }}
            />
          </g>

          <g id="Body">
            <path
              id="tail"
              d="M208,240s-35.8682-1.5507-46-42c-5.4932-25.33-9.237-40.5144-32-48"
              style={{
                fill: "none",
                stroke: "#eba13d",
                strokeLinecap: "round",
                strokeMiterlimit: 10,
                strokeWidth: "28px",
              }}
            />

            <rect
              x="190"
              y="201"
              width="200"
              height="118"
              rx="59"
              style={{ fill: "#eba13d" }}
            />
            <path
              d="M277,234c-8.09.8989-14.5641-27.2905-15.7905-33h20.0554C282.17,208.3027,284.674,233.1473,277,234Z"
              style={{ fill: "#d48533" }}
            />
            <path
              d="M255.2144,201c1.3944,6.6367,8.81,43.0887-1.2144,44-10.2225.9293-17.854-36.8682-18.8819-42.3576C242,201,245,201,255.2144,201Z"
              style={{ fill: "#d48533" }}
            />
            <path
              d="M209.4213,216.2441a58.948,58.948,0,0,1,20.9133-12.2306C231,208,237,241,228,243s-18.5787-26.756-18.5787-26.756Z"
              style={{ fill: "#d48533" }}
            />

            <circle cx="362" cy="253" r="11" style={{ fill: "#ffdf45" }} />
            <path
              id="collar"
              d="M282,199s11.57,23.2994,44.647,31.9507c13.5562,2.9386,26.3219,6.4642,54.353-2.1871"
              style={{
                fill: "none",
                stroke: "#ac1515",
                strokeLinecap: "round",
                strokeMiterlimit: 10,
                strokeWidth: "12px",
              }}
            />

            <g id="Head">
              <g id="Ears">
                <g id="Left_Ear">
                  <path
                    d="M330.99,121.98c5.478,16.8814-1.0848,34.1494-14.66,38.5741s-29.0272-5.6826-34.4857-22.5639c-8.1218-25.0308,1.1923-49.3569,10.2133-52.2936,8.2976-2.7115,30.7571,11.0911,38.9326,36.2835Z"
                    style={{ fill: "#eba13d" }}
                  />
                  <path
                    d="M325.1129,122.783c4.2608,13.33-.84,26.9652-11.3975,30.4548s-22.5683-4.486-26.8291-17.8164c-6.3164-19.76.9265-38.9655,7.9378-41.2871,6.4756-2.14,23.9337,8.7561,30.2888,28.6487Z"
                    style={{ fill: "#d48533" }}
                  />
                </g>
                <g id="Right_Ear">
                  <path
                    d="M372.01,121.98c-5.478,16.8814,1.0849,34.1494,14.66,38.5741s29.0273-5.6826,34.4857-22.5639c8.1218-25.0308-1.1923-49.3569-10.2133-52.2936C402.6447,82.9854,380.1852,96.788,372.01,121.98Z"
                    style={{ fill: "#eba13d" }}
                  />
                  <path
                    d="M377.8871,122.783c-4.2608,13.33.84,26.9652,11.3976,30.4548s22.5682-4.486,26.829-17.8164c6.3164-19.76-.9265-38.9655-7.9378-41.2871-6.4756-2.14-23.9337,8.7561-30.2888,28.6487Z"
                    style={{ fill: "#d48533" }}
                  />
                </g>
              </g>

              <path
                d="M430,164.265C430,207.417,395.0771,231,352,231s-78-23.583-78-66.735S315.7189,89,352,89C387.439,89.02,430,121.1331,430,164.265Z"
                style={{ fill: "#eba13d" }}
              />

              <g id="Face">
                <g id="Left_Eye">
                  <path
                    d="M320,156a13,13,0,1,1,13,13A13,13,0,0,1,320,156Z"
                    style={{ fill: "#33281b" }}
                  />
                  <rect
                    id="left-lid-bot"
                    x="318"
                    y="169"
                    width="30"
                    height="16"
                    style={{ fill: "#eba13d" }}
                  />
                  <rect
                    id="left-lid-top"
                    x="318"
                    y="127"
                    width="30"
                    height="16"
                    style={{ fill: "#eba13d" }}
                  />
                </g>
                <g id="Right_Eye">
                  <path
                    d="M382,156a13,13,0,1,1,13,13A13,13,0,0,1,382,156Z"
                    style={{ fill: "#33281b" }}
                  />
                  <rect
                    id="right-lid-bot"
                    x="380"
                    y="169"
                    width="30"
                    height="16"
                    style={{ fill: "#eba13d" }}
                  />
                  <rect
                    id="right-lid-top"
                    x="380"
                    y="127"
                    width="30"
                    height="16"
                    style={{ fill: "#eba13d" }}
                  />
                </g>
                <g id="Whiskers">
                  <line
                    x1="331"
                    y1="179"
                    x2="273"
                    y2="170"
                    style={{
                      fill: "none",
                      stroke: "#33281b",
                      strokeLinecap: "round",
                      strokeMiterlimit: 10,
                      strokeWidth: "3.4px",
                    }}
                  />
                  <line
                    x1="273"
                    y1="193"
                    x2="331"
                    y2="185"
                    style={{
                      fill: "none",
                      stroke: "#33281b",
                      strokeLinecap: "round",
                      strokeMiterlimit: 10,
                      strokeWidth: "3.4px",
                    }}
                  />
                  <line
                    x1="397"
                    y1="179"
                    x2="455"
                    y2="171"
                    style={{
                      fill: "none",
                      stroke: "#33281b",
                      strokeLinecap: "round",
                      strokeMiterlimit: 10,
                      strokeWidth: "3.4px",
                    }}
                  />
                  <line
                    x1="455"
                    y1="193"
                    x2="397"
                    y2="185"
                    style={{
                      fill: "none",
                      stroke: "#33281b",
                      strokeLinecap: "round",
                      strokeMiterlimit: 10,
                      strokeWidth: "3.4px",
                    }}
                  />
                </g>
                <g id="Nose">
                  <path
                    d="M389,184.4848C389,196.0818,377.8071,208,364,208s-25-11.9182-25-23.5152C339,176.4523,350.1929,166,364,166S389,176.3117,389,184.4848Z"
                    style={{ fill: "#fff" }}
                  />
                  <path
                    d="M373,176.816c0,2.3844-4.0269,6.684-9,6.684s-9-4.3-9-6.684,4.0269-4.316,9-4.316S373,174.4316,373,176.816Z"
                    style={{ fill: "#33281b" }}
                  />
                  <path
                    d="M348.0026,183A8.0013,8.0013,0,0,0,364,183a8.0013,8.0013,0,0,0,16.0026,0"
                    style={{
                      fill: "none",
                      stroke: "#33281b",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "3.4px",
                    }}
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
