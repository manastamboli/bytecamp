/**
 * COMPONENT REGISTRY
 *
 * Central registry mapping component types to React components
 * All components must support: props, styles, isSelected, onClick
 */

// Existing components
import Hero from "./Hero";
import Text from "./Text";
import Image from "./Image";
import Button from "./Button";
import Gallery from "./Gallery";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Features from "./Features";
import CTA from "./CTA";

// New content components
import Heading from "./Heading";
import Link from "./Link";
import LinkBox from "./LinkBox";
import ImageBox from "./ImageBox";
import Divider from "./Divider";

// Media components
import Video from "./Video";
import Map from "./Map";
import Icon from "./Icon";

// Form components
import Form from "./Form";
import Input from "./Input";
import Textarea from "./Textarea";
import Select from "./Select";
import Label from "./Label";
import Checkbox from "./Checkbox";
import Radio from "./Radio";
import FormEmbed from "./FormEmbed";

export const componentRegistry = {
  // Hero & Features
  Hero,
  Features,
  CTA,

  // Navigation
  Navbar,
  Footer,

  // Content
  Heading,
  Text,
  Link,
  LinkBox,
  Divider,

  // Media
  Image,
  ImageBox,
  Video,
  Map,
  Icon,
  Gallery,

  // Form Elements
  Form,
  Input,
  Textarea,
  Select,
  Button,
  Label,
  Checkbox,
  Radio,
  FormEmbed,
};

/**
 * Default props for each component type
 * Used when creating new components
 */
export const defaultComponentProps = {
  Hero: {
    title: "Welcome to Your Site",
    subtitle: "Build amazing websites with ease",
    ctaText: "Get Started",
    ctaLink: "#",
  },
  Features: {
    title: "Our Features",
    items: [
      { title: "Fast", description: "Lightning-fast performance" },
      { title: "Secure", description: "Enterprise-grade security" },
      { title: "Scalable", description: "Grows with your business" },
    ],
  },
  CTA: {
    title: "Ready to Get Started?",
    description: "Join thousands of satisfied customers",
    buttonText: "Sign Up Now",
  },
  Navbar: {
    logo: "Your Brand",
    links: [
      { label: "Home", href: "#" },
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  Footer: {
    copyright: "© 2026 Your Company. All rights reserved.",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
  Heading: {
    text: "Heading Text",
    level: "h2",
  },
  Text: {
    content: "Enter your text here",
    variant: "p",
  },
  Link: {
    text: "Click here",
    href: "#",
    openInNewTab: false,
  },
  LinkBox: {
    title: "Link Title",
    description: "Click to navigate",
    href: "#",
    openInNewTab: false,
  },
  Divider: {
    thickness: 1,
    style: "solid",
  },
  Image: {
    src: "https://via.placeholder.com/800x400",
    alt: "Placeholder image",
    width: null,
    height: null,
    objectFit: "cover",
    borderRadius: 0,
    linkUrl: "",
  },
  ImageBox: {
    src: "https://via.placeholder.com/800x600",
    alt: "Image",
    caption: "",
    aspectRatio: "16/9",
  },
  Video: {
    url: "",
    type: "youtube",
    autoplay: false,
    controls: true,
  },
  Map: {
    address: "",
    latitude: null,
    longitude: null,
    zoom: 15,
    height: 400,
  },
  Icon: {
    name: "Star",
    size: 24,
  },
  Gallery: {
    images: [
      { src: "https://via.placeholder.com/400", alt: "Image 1" },
      { src: "https://via.placeholder.com/400", alt: "Image 2" },
      { src: "https://via.placeholder.com/400", alt: "Image 3" },
    ],
    columns: 3,
  },
  Form: {
    action: "#",
    method: "POST",
    name: "contact-form",
  },
  Input: {
    type: "text",
    placeholder: "Enter text",
    name: "input-field",
    label: "Input Label",
    required: false,
  },
  Textarea: {
    placeholder: "Enter your message",
    name: "message",
    label: "Message",
    required: false,
    rows: 4,
  },
  Select: {
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
    name: "select-field",
    label: "Select Option",
    required: false,
    placeholder: "Choose...",
  },
  Button: {
    text: "Click Me",
    variant: "primary",
    openInNewTab: false,
  },
  Label: {
    text: "Label Text",
    htmlFor: "",
  },
  Checkbox: {
    label: "I agree to the terms",
    name: "checkbox",
    checked: false,
    required: false,
  },
  Radio: {
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ],
    name: "radio-group",
    label: "Choose one",
    required: false,
  },
  FormEmbed: {
    formId: null,
    formName: "Select a form",
    showTitle: true,
  },
};
