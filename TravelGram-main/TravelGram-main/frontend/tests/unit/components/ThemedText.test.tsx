import { render } from '@testing-library/react-native';
import { ThemedText } from '../../../components/ThemedText';

describe('ThemedText Component Tests', () => {
  test('renders with default style', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    const textElement = getByText('Hello World');
    expect(textElement).toHaveStyle({
      fontSize: 16,
      lineHeight: 24
    });
  });

  test('applies title style correctly', () => {
    const { getByText } = render(
      <ThemedText type="title">Title Text</ThemedText>
    );
    const titleElement = getByText('Title Text');
    expect(titleElement).toHaveStyle({
      fontSize: 32,
      fontWeight: 'bold'
    });
  });

  test('applies custom style', () => {
    const customStyle = { color: 'red' };
    const { getByText } = render(
      <ThemedText style={customStyle}>Custom Style Text</ThemedText>
    );
    const textElement = getByText('Custom Style Text');
    expect(textElement).toHaveStyle(customStyle);
  });
}); 