/*
Copyright (c) Facebook, Inc. and its affiliates.
*/

// src/components/LiveObjects.js

import React from "react";
import { Rnd } from "react-rnd";
import { Stage, Layer, Image as KImage, Rect, Text } from "react-konva";
import { schemeCategory10 as colorScheme } from "d3-scale-chromatic";
import ObjectFixup from "./ObjectFixup";

// fast string hash https://stackoverflow.com/a/15710692
var hashCode = (s) =>
  s.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

/**
 * Displays an image along with the object bounding boxes.
 * The object metadata and image are passed via setState.
 * Example metadata format is in the comments below.
 */
class LiveObjects extends React.Component {
  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
    this.onFixup = this.onFixup.bind(this);
    this.initialState = {
      height: props.height,
      width: props.width,
      rgb: null,
      objects: null,
    };
    this.state = this.initialState;
  }

  onResize(e, direction, ref, delta, position) {
    this.setState({
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
    });
  }

  onFixup() {
    if (this.props.stateManager) {
      let stateManager = this.props.stateManager;
      let fixer = undefined;
      stateManager.refs.forEach((ref) => {
        if (ref instanceof ObjectFixup) {
          fixer = ref;
        }
      });
      if (fixer !== undefined) {
        fixer.setState({
          image: this.state.rgb,
        });
        var myLayout = stateManager.dashboardLayout;
        // switch the active tab in the layout to the annotation tab
        for (var i = 0; i < myLayout._getAllContentItems().length; i++) {
          if (
            myLayout._getAllContentItems()[i].config.component === "ObjectFixup"
          ) {
            var contentItem = myLayout._getAllContentItems()[i];
            contentItem.parent.setActiveContentItem(contentItem);
          }
        }
      }
    }
  }

  componentDidMount() {
    if (this.props.stateManager) this.props.stateManager.connect(this);
  }

  render() {
    const { height, width, rgb, objects } = this.state;
    const { offsetW, offsetH } = this.props;

    if (rgb === null) {
      return (
        <Rnd
          default={{
            x: offsetW,
            y: offsetH,
            width: width,
            height: height,
          }}
          lockAspectRatio={true}
          onResize={this.onResize}
        >
          <p>Loading...</p>
        </Rnd>
      );
    }

    /* example "objects": [
      {"xyz": [-0.35, -0.35, 1.35],
       "bbox": [398.8039245605469, 249.9073944091797, 424.7720642089844, 307.53729248046875],
       "label": "chair"},
      ]
    */
    var renderedObjects = [];
    let j = 0;
    objects.forEach((obj) => {
      let obj_id = obj.id;
      let label = String(obj_id).concat(obj.label);
      let properties = obj.properties;
      let hash = hashCode(label.concat(properties));
      let color = colorScheme[Math.abs(hash % colorScheme.length)];
      let scale = height / 512;
      let x1 = parseInt(obj.bbox[0] * scale);
      let y1 = parseInt(obj.bbox[1] * scale);
      let x2 = parseInt(obj.bbox[2] * scale);
      let y2 = parseInt(obj.bbox[3] * scale);
      let h = y2 - y1;
      let w = x2 - x1;
      renderedObjects.push(
        <Rect
          key={j}
          x={x1}
          y={y1}
          width={w}
          height={h}
          fillEnabled={false}
          stroke={color}
        />
      );
      renderedObjects.push(
        <Text
          key={[j++, label]}
          text={label.concat("\n", properties)}
          x={x1}
          y={y1}
          fill={color}
          fontSize={10}
        />
      );
    });

    return (
      <Rnd
        default={{
          x: offsetW,
          y: offsetH,
          width: width,
          height: height,
        }}
        lockAspectRatio={true}
        onResize={this.onResize}
      >
        <Stage width={width} height={height}>
          <Layer>
            <KImage image={rgb} width={width} height={height} />
            {renderedObjects}
          </Layer>
        </Stage>
        <button onClick={this.onFixup}>Fix</button>
      </Rnd>
    );
  }
}

export default LiveObjects;
